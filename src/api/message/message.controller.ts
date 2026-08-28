import { Response } from 'express'
import {
  AccessDeniedError,
  MessageService,
  NotFoundError,
} from './message.service'
import { MessageRole } from './message.model'
import { logger } from '../../services/logger.service'
import type { AuthRequest } from '../../middleware/auth.middleware'
import { ChatSocketGateway } from '../../services/socket/chat-socket.gateway'

function getUserId(req: AuthRequest): string | null {
  const id = req.user?._id || req.user?.id
  return id ? String(id) : null
}

function handleError(res: Response, err: unknown, fallback: string) {
  if (err instanceof AccessDeniedError) {
    return res.status(403).send({ err: err.message })
  }
  if (err instanceof NotFoundError) {
    return res.status(404).send({ err: err.message })
  }
  logger.error(fallback, err)
  const message = err instanceof Error ? err.message : fallback
  return res.status(500).send({ err: message })
}

export class MessageController {
  static async list(req: AuthRequest, res: Response) {
    try {
      const userId = getUserId(req)
      if (!userId) return res.status(401).send({ err: 'Not authenticated' })

      const { workoutId, exerciseId } = req.query as {
        workoutId?: string
        exerciseId?: string
      }
      if (!workoutId || !exerciseId) {
        return res
          .status(400)
          .send({ err: 'workoutId and exerciseId are required' })
      }

      const messages = await MessageService.listByRoom(
        userId,
        workoutId,
        exerciseId
      )
      res.json(messages)
    } catch (err) {
      handleError(res, err, 'Failed to list messages')
    }
  }

  static async add(req: AuthRequest, res: Response) {
    try {
      const userId = getUserId(req)
      if (!userId) return res.status(401).send({ err: 'Not authenticated' })

      const { workoutId, exerciseId, role, content, _id } = req.body as {
        workoutId?: string
        exerciseId?: string
        role?: MessageRole
        content?: string
        _id?: string
      }
      if (!workoutId || !exerciseId || !role) {
        return res
          .status(400)
          .send({ err: 'workoutId, exerciseId, and role are required' })
      }

      const message = await MessageService.add(userId, {
        _id,
        workoutId,
        exerciseId,
        role,
        content: content || '',
      })

      ChatSocketGateway.emitMessageAdded(workoutId, exerciseId, message)
      const workout = await MessageService.getWorkoutOrThrow(workoutId)
      const notifyIds = await MessageService.notifyUserIdsForWorkout(workout)
      ChatSocketGateway.emitUnread(notifyIds, {
        workoutId,
        exerciseId,
        forUserId: String(workout.forUserId),
        senderRole: message.role,
      })

      res.json(message)
    } catch (err) {
      handleError(res, err, 'Failed to add message')
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const userId = getUserId(req)
      if (!userId) return res.status(401).send({ err: 'Not authenticated' })

      const { role, content } = req.body as {
        role?: MessageRole
        content?: string
      }
      if (!role) {
        return res.status(400).send({ err: 'role is required' })
      }

      const message = await MessageService.update(
        userId,
        req.params.id,
        role,
        content || ''
      )
      if (!message) {
        return res.status(404).send({ err: 'Message not found' })
      }

      ChatSocketGateway.emitMessageUpdated(
        message.workoutId,
        message.exerciseId,
        message
      )
      res.json(message)
    } catch (err) {
      handleError(res, err, 'Failed to update message')
    }
  }

  static async remove(req: AuthRequest, res: Response) {
    try {
      const userId = getUserId(req)
      if (!userId) return res.status(401).send({ err: 'Not authenticated' })

      const role = (req.query.role || req.body?.role) as MessageRole | undefined
      if (!role) {
        return res.status(400).send({ err: 'role is required' })
      }

      const existing = await MessageService.remove(userId, req.params.id, role)
      ChatSocketGateway.emitMessageRemoved(
        existing.workoutId,
        existing.exerciseId,
        String(existing._id)
      )
      const workout = await MessageService.getWorkoutOrThrow(existing.workoutId)
      const notifyIds = await MessageService.notifyUserIdsForWorkout(workout)
      ChatSocketGateway.emitUnread(notifyIds)

      res.json({ ok: true })
    } catch (err) {
      handleError(res, err, 'Failed to delete message')
    }
  }

  static async markRead(req: AuthRequest, res: Response) {
    try {
      const userId = getUserId(req)
      if (!userId) return res.status(401).send({ err: 'Not authenticated' })

      const { workoutId, exerciseId } = req.body as {
        workoutId?: string
        exerciseId?: string
      }
      if (!workoutId || !exerciseId) {
        return res
          .status(400)
          .send({ err: 'workoutId and exerciseId are required' })
      }

      const result = await MessageService.markRead(
        userId,
        workoutId,
        exerciseId
      )
      const workout = await MessageService.getWorkoutOrThrow(workoutId)
      const notifyIds = await MessageService.notifyUserIdsForWorkout(workout)
      ChatSocketGateway.emitUnread(notifyIds)
      res.json(result)
    } catch (err) {
      handleError(res, err, 'Failed to mark read')
    }
  }

  static async unread(req: AuthRequest, res: Response) {
    try {
      const userId = getUserId(req)
      if (!userId) return res.status(401).send({ err: 'Not authenticated' })

      const asRole = (req.query.asRole as MessageRole) || 'trainee'
      if (asRole !== 'trainer' && asRole !== 'trainee') {
        return res
          .status(400)
          .send({ err: 'asRole must be trainer or trainee' })
      }

      const summary = await MessageService.unreadSummary(userId, asRole)
      res.json(summary)
    } catch (err) {
      handleError(res, err, 'Failed to get unread summary')
    }
  }
}
