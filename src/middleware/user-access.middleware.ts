import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Model } from 'mongoose'
import type { AuthRequest, JWTPayload } from './auth.middleware'
import { canAccessUser, isTrainerAccount } from '../services/user-access.service'
import { TrainerRequest } from '../api/trainer-request/trainer-request.model'

type Bag = 'query' | 'body' | 'params'

type FieldRule = {
  from: Bag
  name: string
  required?: boolean
  allowTrainer?: boolean
}

type AccessOptions = {
  oneOf?: boolean
  when?: 'always' | 'ifPresent'
}

type IdAt = {
  param?: string
  query?: string
  body?: string
  by?: string
}

type DocOptions = {
  allowTrainer?: boolean
  allowMissingOwner?: boolean
  when?: 'always' | 'ifOwned'
}

type LooseDoc = Record<string, unknown>

function readActor(req: AuthRequest) {
  const header = req.headers.authorization
  const headerToken = header?.startsWith('Bearer ') ? header.slice(7) : null
  const token = req.cookies?.loginToken || headerToken
  if (!token) return ''

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JWTPayload
    if (decoded.isGuest) return ''
    const id = decoded._id || decoded.id
    if (!id) return ''
    req.user = decoded
    return String(id)
  } catch {
    return ''
  }
}

function asId(value: unknown): string {
  if (typeof value !== 'string') return ''
  const id = value.trim()
  return id
}

function readPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[key]
  }, source)
}

function idList(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => idList(item))
  const id = asId(value)
  if (!id) return []
  return id.split(',').map((part) => part.trim()).filter(Boolean)
}

function sendUnauthenticated(res: Response) {
  res.status(401).send({ err: 'Not authenticated' })
}

function sendNotAllowed(res: Response) {
  res.status(403).send({ err: 'Not allowed' })
}

async function actorCan(
  actorId: string,
  subjectId: string,
  allowTrainer: boolean
) {
  return canAccessUser(actorId, subjectId, allowTrainer)
}

export function requireUserAccess(
  rules: FieldRule[] = [],
  options: AccessOptions = {}
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const present = rules
      .map((rule) => ({
        rule,
        id: asId(readPath(req[rule.from], rule.name)),
      }))
      .filter((entry) => entry.id)

    if (options.when === 'ifPresent' && !present.length) return next()

    const actorId = readActor(req)
    if (!actorId) return sendUnauthenticated(res)

    if (options.oneOf && rules.length && !present.length) {
      return res.status(400).send({ err: 'Missing user' })
    }

    for (const rule of rules) {
      const id = asId(readPath(req[rule.from], rule.name))
      if (!id) {
        if (rule.required) return res.status(400).send({ err: 'Missing user' })
        continue
      }
      const allowed = await actorCan(actorId, id, rule.allowTrainer !== false)
      if (!allowed) return sendNotAllowed(res)
    }

    next()
  }
}

export const requireLogin = requireUserAccess()

function idFrom(req: AuthRequest, at: IdAt) {
  if (at.body) return asId(readPath(req.body, at.body))
  if (at.query) return asId(readPath(req.query, at.query))
  return asId(req.params[at.param || 'id'])
}

async function loadDoc(model: Model<any>, id: string, by: string) {
  const query = model.findOne(by === '_id' ? { _id: id } : { [by]: id })
  return (await query.lean()) as LooseDoc | null
}

async function ownerAllowed(
  actorId: string,
  doc: LooseDoc | null,
  ownerField: string,
  options: DocOptions
) {
  if (!doc) return 'missing' as const
  const ownerId = asId(doc[ownerField])
  if (!ownerId) {
    return options.allowMissingOwner ? ('open' as const) : ('denied' as const)
  }
  const allowed = await actorCan(
    actorId,
    ownerId,
    options.allowTrainer !== false
  )
  return allowed ? ('ok' as const) : ('denied' as const)
}

export function requireDocAccess(
  model: Model<any>,
  ownerField: string,
  at: IdAt = {},
  options: DocOptions = {}
) {
  const by = at.by || '_id'

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const id = idFrom(req, at)
    if (!id) return res.status(400).send({ err: 'Missing user' })

    let doc: LooseDoc | null
    try {
      doc = await loadDoc(model, id, by)
    } catch {
      return res.status(400).send({ err: 'Missing user' })
    }

    const ownerId = asId(doc?.[ownerField])
    if (options.when === 'ifOwned' && (!doc || !ownerId)) return next()

    const actorId = readActor(req)
    if (!actorId) return sendUnauthenticated(res)
    if (!doc) return next()

    const result = await ownerAllowed(actorId, doc, ownerField, options)
    if (result === 'denied') return sendNotAllowed(res)
    next()
  }
}

export function requireManyDocs(
  model: Model<any>,
  ownerField: string,
  at: { query: string; by?: string },
  options: DocOptions = {}
) {
  const by = at.by || '_id'

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const ids = idList(readPath(req.query, at.query))
    if (!ids.length) return res.status(400).send({ err: 'Missing user' })

    let docs: LooseDoc[]
    try {
      docs = (await model
        .find({ [by]: { $in: ids } })
        .select(ownerField)
        .lean()) as LooseDoc[]
    } catch {
      return res.status(400).send({ err: 'Missing user' })
    }

    const needsOwner = docs.some((doc) => asId(doc[ownerField]))
    if (options.when === 'ifOwned' && !needsOwner) return next()

    const actorId = readActor(req)
    if (!actorId) return sendUnauthenticated(res)

    for (const doc of docs) {
      const result = await ownerAllowed(actorId, doc, ownerField, options)
      if (result === 'denied') return sendNotAllowed(res)
    }

    next()
  }
}

export function requireRelatedAccess(
  model: Model<any>,
  relationField: string,
  related: Model<any>,
  ownerField: string,
  at: IdAt = {},
  options: DocOptions = {}
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const actorId = readActor(req)
    if (!actorId) return sendUnauthenticated(res)

    const id = idFrom(req, at)
    if (!id) return res.status(400).send({ err: 'Missing user' })

    let doc: LooseDoc | null
    try {
      doc = await loadDoc(model, id, '_id')
    } catch {
      return res.status(400).send({ err: 'Missing user' })
    }
    if (!doc) return next()

    const relatedId = asId(doc[relationField])
    if (!relatedId) return sendNotAllowed(res)

    let ownerDoc: LooseDoc | null
    try {
      ownerDoc = await loadDoc(related, relatedId, '_id')
    } catch {
      return sendNotAllowed(res)
    }

    const result = await ownerAllowed(actorId, ownerDoc, ownerField, options)
    if (result !== 'ok') return sendNotAllowed(res)
    next()
  }
}

export function requireListAccess(options: {
  userField: string
  sessionModel?: Model<any>
  sessionField?: string
  allowTrainer?: boolean
}) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const actorId = readActor(req)
    if (!actorId) return sendUnauthenticated(res)
    if (!Array.isArray(req.body) || !req.body.length) {
      return res.status(400).send({ err: 'Missing user' })
    }

    const allowTrainer = options.allowTrainer !== false
    const sessionIds = new Set<string>()

    for (const row of req.body) {
      const userId = asId(row?.[options.userField])
      if (!userId) return res.status(400).send({ err: 'Missing user' })
      const allowed = await actorCan(actorId, userId, allowTrainer)
      if (!allowed) return sendNotAllowed(res)

      if (options.sessionField) {
        const sessionId = asId(row?.[options.sessionField])
        if (!sessionId) return res.status(400).send({ err: 'Missing user' })
        sessionIds.add(sessionId)
      }
    }

    if (options.sessionModel) {
      for (const sessionId of sessionIds) {
        let session: LooseDoc | null
        try {
          session = await loadDoc(options.sessionModel, sessionId, '_id')
        } catch {
          return sendNotAllowed(res)
        }
        const result = await ownerAllowed(
          actorId,
          session,
          'userId',
          { allowTrainer }
        )
        if (result !== 'ok') return sendNotAllowed(res)
      }
    }

    next()
  }
}

export function requireRequestParty(fields: Array<'trainerId' | 'traineeId'>) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const actorId = readActor(req)
    if (!actorId) return sendUnauthenticated(res)

    let request: LooseDoc | null
    try {
      request = (await TrainerRequest.findById(req.params.id).lean()) as LooseDoc | null
    } catch {
      return next()
    }
    if (!request) return next()

    const isParty = fields.some((field) => asId(request?.[field]) === actorId)
    if (!isParty) return sendNotAllowed(res)
    next()
  }
}

export const requireSelfUser = requireUserAccess([
  { from: 'body', name: 'userId', required: true, allowTrainer: false },
])

export function requireSelfWhenConnect(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.body?.intent !== 'connect') return next()
  return requireSelfUser(req, res, next)
}

export async function requireTrainerSearch(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const actorId = readActor(req)
  if (!actorId) return sendUnauthenticated(res)

  const searchingUserId = asId(req.query.searchingUserId)
  if (searchingUserId && searchingUserId !== actorId) return sendNotAllowed(res)

  const isTrainer = await isTrainerAccount(actorId)
  if (!isTrainer) return sendNotAllowed(res)
  next()
}
