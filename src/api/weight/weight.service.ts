import { Weight, IWeight } from './weight.model'
import { logger } from '../../services/logger.service'
import { CloudinaryMediaService } from '../../services/cloudinary/cloudinary.service'

const MEASURE_FIELDS = [
  'kg',
  'waistCm',
  'bodyFat',
  'neckCm',
  'chestCm',
  'armsCm',
  'hipsCm',
  'thighCm',
  'calfCm',
] as const

const CONTENT_FIELDS = [...MEASURE_FIELDS, 'imageUrl'] as const

function utcDayBounds(createdAt: number) {
  const date = new Date(createdAt).toISOString().slice(0, 10)
  return {
    start: new Date(`${date}T00:00:00.000Z`).getTime(),
    end: new Date(`${date}T23:59:59.999Z`).getTime(),
  }
}

function splitPatch(weight: Record<string, unknown>) {
  const set: Record<string, number | string> = {}
  const unset: Record<string, ''> = {}

  CONTENT_FIELDS.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(weight, field)) return
    const value = weight[field]
    if (value === null || value === undefined || value === '') {
      unset[field] = ''
      return
    }
    if (field === 'imageUrl') {
      if (typeof value === 'string') set[field] = value
      return
    }
    const numeric = Number(value)
    if (Number.isFinite(numeric)) set[field] = numeric
  })

  return { set, unset }
}

async function destroyPhoto(url?: string | null) {
  if (!url) return
  try {
    await CloudinaryMediaService.destroyImagesByDeliveryUrls([url])
  } catch (err) {
    logger.error('Failed to delete weight photo', err)
  }
}

function hasContent(weight: Record<string, unknown> | null | undefined) {
  if (!weight) return false
  return CONTENT_FIELDS.some((field) => {
    const value = weight[field]
    return value !== undefined && value !== null && value !== ''
  })
}

export class WeightService {
  static async query(filterBy: Partial<IWeight> = {}) {
    try {
      const weights = await Weight.find(filterBy as any).sort({ createdAt: -1 })
      return weights
    } catch (err) {
      logger.error('WeightService.query failed', err)
      throw err
    }
  }

  static async listByUser(
    userId: string,
    fromDate: string | null,
    toDate: string | null,
    skip?: number,
    limit?: number
  ) {
    try {
      const fromDateMs = fromDate ? new Date(fromDate).getTime() : 0
      const toDateMs = toDate ? new Date(toDate).getTime() : Date.now()
      let weightsQuery = Weight.find({
        userId,
        createdAt: { $gte: fromDateMs, $lte: toDateMs },
      }).sort({ createdAt: -1 })

      if (skip && skip > 0) weightsQuery = weightsQuery.skip(skip)
      if (limit && limit > 0) weightsQuery = weightsQuery.limit(limit)

      return weightsQuery
    } catch (err) {
      logger.error(`WeightService.listByUser failed for ${userId}`, err)
      throw err
    }
  }

  static async getById(id: string) {
    try {
      const weight = await Weight.findById(id)
      return weight
    } catch (err) {
      logger.error(`WeightService.getById failed for ${id}`, err)
      throw err
    }
  }

  static async add(weight: Partial<IWeight>) {
    try {
      if (!weight.userId || weight.createdAt == null) {
        throw new Error('userId and createdAt are required')
      }

      const { start, end } = utcDayBounds(weight.createdAt)
      const existing = await Weight.findOne({
        userId: weight.userId,
        createdAt: { $gte: start, $lte: end },
      }).sort({ createdAt: -1 })

      if (existing) return this.update(String(existing._id), weight)

      const { set } = splitPatch(weight as Record<string, unknown>)
      if (!Object.keys(set).length) throw new Error('Nothing to save')

      return Weight.create({
        userId: weight.userId,
        createdAt: start,
        ...set,
      })
    } catch (err) {
      logger.error('WeightService.add failed', err)
      throw err
    }
  }

  static async update(id: string, weightToUpdate: Partial<IWeight>) {
    try {
      const existing = await Weight.findById(id)
      if (!existing) return null

      const patch = weightToUpdate as Record<string, unknown>
      const { set, unset } = splitPatch(patch)
      const updateDoc: Record<string, unknown> = {}
      if (Object.keys(set).length) updateDoc.$set = set
      if (Object.keys(unset).length) updateDoc.$unset = unset

      const updated = Object.keys(updateDoc).length
        ? await Weight.findByIdAndUpdate(id, updateDoc, { new: true })
        : existing

      const previousUrl = existing.imageUrl
      const touchesPhoto = Object.prototype.hasOwnProperty.call(patch, 'imageUrl')
      const nextUrl = touchesPhoto
        ? typeof set.imageUrl === 'string'
          ? set.imageUrl
          : undefined
        : previousUrl

      if (
        !updated ||
        !hasContent(updated.toObject() as unknown as Record<string, unknown>)
      ) {
        await Weight.findByIdAndDelete(id)
        await destroyPhoto(previousUrl)
        return null
      }

      if (previousUrl && previousUrl !== nextUrl) await destroyPhoto(previousUrl)
      return updated
    } catch (err) {
      logger.error(`WeightService.update failed for ${id}`, err)
      throw err
    }
  }

  static async remove(id: string) {
    try {
      const existing = await Weight.findById(id)
      await Weight.findByIdAndDelete(id)
      await destroyPhoto(existing?.imageUrl)
    } catch (err) {
      logger.error(`WeightService.remove failed for ${id}`, err)
      throw err
    }
  }
  static async removeAllByUserId(userId: string) {
    try {
      await Weight.deleteMany({ userId })
    } catch (err) {
      logger.error(`WeightService.removeAllByUserId failed for ${userId}`, err)
      throw err
    }
  }
}
