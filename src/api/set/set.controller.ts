import { Request, Response } from 'express'
import { SetService } from './set.service'
import { logger } from '../../services/logger.service'

export class SetController {
  static async getSets(req: Request, res: Response) {
    try {
      const sets = await SetService.query(req.query)
      res.json(sets)
    } catch (err: any) {
      logger.error('Failed to get sets', err)
      res.status(500).send({ err: 'Failed to get sets' })
    }
  }

  static async getSet(req: Request, res: Response) {
    try {
      const set = await SetService.getById(req.params.id)
      if (!set) {
        return res.status(404).send({ err: 'Set not found' })
      }
      res.json(set)
    } catch (err: any) {
      logger.error('Failed to get set', err)
      res.status(500).send({ err: 'Failed to get set' })
    }
  }

  static async getSetsBySessionId(req: Request, res: Response) {
    try {
      const sessionId = req.params.sessionId
      const sets = await SetService.getBySessionId(sessionId)
      res.json(sets)
    } catch (err: any) {
      logger.error('Failed to get sets by session id', err)
      res.status(500).send({ err: 'Failed to get sets by session id' })
    }
  }

  static async getSetsBySessionIdAndExerciseId(req: Request, res: Response) {
    try {
      const { sessionId, exerciseId } = req.params
      const sets = await SetService.getBySessionIdAndExerciseId(
        sessionId,
        exerciseId
      )
      res.json(sets)
    } catch (err: any) {
      logger.error('Failed to get sets by session id and exercise id', err)
      res
        .status(500)
        .send({ err: 'Failed to get sets by session id and exercise id' })
    }
  }

  static async addSet(req: Request, res: Response) {
    try {
      const set = req.body
      delete set._id
      const addedSet = await SetService.add(set)
      res.json(addedSet)
    } catch (err: any) {
      logger.error('Failed to add set', err)
      res.status(500).send({ err: 'Failed to add set' })
    }
  }

  static async updateSet(
    req: Request & { user?: { _id: string } },
    res: Response
  ) {
    try {
      const set = req.body
      const updatedSet = await SetService.update(req.params.id, set)
      if (!updatedSet) {
        return res.status(404).send({ err: 'Set not found' })
      }
      res.json(updatedSet)
    } catch (err: any) {
      logger.error('Failed to update set', err)
      res.status(500).send({ err: 'Failed to update set' })
    }
  }

  static async deleteSet(req: Request, res: Response) {
    try {
      await SetService.remove(req.params.id)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete set', err)
      res.status(500).send({ err: 'Failed to delete set' })
    }
  }

  static async deleteSetsBySessionId(req: Request, res: Response) {
    try {
      const sessionId = req.params.sessionId
      await SetService.removeBySessionId(sessionId)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete sets by session id', err)
      res.status(500).send({ err: 'Failed to delete sets by session id' })
    }
  }

  static async deleteSetsBySessionIdAndExerciseId(req: Request, res: Response) {
    try {
      const { sessionId, exerciseId } = req.params
      await SetService.removeBySessionIdAndExerciseId(sessionId, exerciseId)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete sets by session id and exercise id', err)
      res
        .status(500)
        .send({ err: 'Failed to delete sets by session id and exercise id' })
    }
  }

  static async saveSetBySessionIdAndExerciseIdAndSetIndex(
    req: Request,
    res: Response
  ) {
    try {
      const { sessionId, exerciseId, setIndex } = req.params
      const set = req.body
      const savedSet = await SetService.saveBySessionIdAndExerciseIdAndSetIndex(
        sessionId,
        exerciseId,
        Number(setIndex),
        set
      )
      res.json(savedSet)
    } catch (err: any) {
      logger.error(
        'Failed to save set by session id and exercise id and set index',
        err
      )
      res.status(500).send({
        err: 'Failed to save set by session id and exercise id and set index',
      })
    }
  }

  static async addSetBySessionIdAndExerciseIdAndSetIndex(
    req: Request,
    res: Response
  ) {
    try {
      const { sessionId, exerciseId, setIndex } = req.params
      const set = req.body
      const addedSet = await SetService.addBySessionIdAndExerciseIdAndSetIndex(
        sessionId,
        exerciseId,
        Number(setIndex),
        set
      )
      res.json(addedSet)
    } catch (err: any) {
      logger.error(
        'Failed to add set by session id and exercise id and set index',
        err
      )
      res.status(500).send({
        err: 'Failed to add set by session id and exercise id and set index',
      })
    }
  }

  static async deleteSetBySessionIdAndExerciseIdAndSetIndex(
    req: Request,
    res: Response
  ) {
    try {
      const { sessionId, exerciseId, setIndex } = req.params
      await SetService.removeBySessionIdAndExerciseIdAndSetIndex(
        sessionId,
        exerciseId,
        Number(setIndex)
      )
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error(
        'Failed to delete set by session id and exercise id and set index',
        err
      )
      res
        .status(500)
        .send({
          err: 'Failed to delete set by session id and exercise id and set index',
        })
    }
  }
}
