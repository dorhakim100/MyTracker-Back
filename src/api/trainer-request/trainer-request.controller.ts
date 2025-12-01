import { Request, Response } from 'express'
import { TrainerRequestService } from './trainer-request.service'
import { logger } from '../../services/logger.service'

export class TrainerRequestController {
  static async getRequests(req: Request, res: Response) {
    try {
      const requests = await TrainerRequestService.query(req.query)
      res.json(requests)
    } catch (err: any) {
      logger.error('Failed to get trainer requests', err)
      res.status(500).send({ err: 'Failed to get trainer requests' })
    }
  }

  static async getRequest(req: Request, res: Response) {
    try {
      const request = await TrainerRequestService.getById(req.params.id)
      if (!request) {
        return res.status(404).send({ err: 'Trainer request not found' })
      }
      res.json(request)
    } catch (err: any) {
      logger.error('Failed to get trainer request', err)
      res.status(500).send({ err: 'Failed to get trainer request' })
    }
  }

  static async getByTrainer(req: Request, res: Response) {
    try {
      const trainerId = req.params.trainerId
      const requests = await TrainerRequestService.getByTrainerId(trainerId)
      res.json(requests)
    } catch (err: any) {
      logger.error('Failed to get trainer requests by trainer', err)
      res.status(500).send({ err: 'Failed to get trainer requests by trainer' })
    }
  }

  static async getByTrainee(req: Request, res: Response) {
    try {
      const traineeId = req.params.traineeId
      const requests = await TrainerRequestService.getByTraineeId(traineeId)
      res.json(requests)
    } catch (err: any) {
      logger.error('Failed to get trainer requests by trainee', err)
      res.status(500).send({ err: 'Failed to get trainer requests by trainee' })
    }
  }

  static async getPendingByTrainer(req: Request, res: Response) {
    try {
      const trainerId = req.params.trainerId
      const requests = await TrainerRequestService.getPendingByTrainerId(
        trainerId
      )
      res.json(requests)
    } catch (err: any) {
      logger.error('Failed to get pending trainer requests by trainer', err)
      res
        .status(500)
        .send({ err: 'Failed to get pending trainer requests by trainer' })
    }
  }

  static async getPendingByTrainee(req: Request, res: Response) {
    try {
      const traineeId = req.params.traineeId
      const requests = await TrainerRequestService.getPendingByTraineeId(
        traineeId
      )
      res.json(requests)
    } catch (err: any) {
      logger.error('Failed to get pending trainer requests by trainee', err)
      res
        .status(500)
        .send({ err: 'Failed to get pending trainer requests by trainee' })
    }
  }

  static async createRequest(req: Request, res: Response) {
    try {
      const requestData = req.body

      const request = {
        trainerId: requestData.trainer,
        traineeId: requestData.trainee,
      }

      const newRequest = await TrainerRequestService.create(request)
      res.status(201).json(newRequest)
    } catch (err: any) {
      logger.error('Failed to create trainer request', err)
      const statusCode =
        err.message.includes('not found') ||
        err.message.includes('not a trainer') ||
        err.message.includes('yourself') ||
        err.message.includes('already exists')
          ? 400
          : 500
      res
        .status(statusCode)
        .send({ err: err.message || 'Failed to create trainer request' })
    }
  }

  static async approveRequest(req: Request, res: Response) {
    try {
      const requestId = req.params.id
      const approvedRequest = await TrainerRequestService.approve(requestId)
      res.json(approvedRequest)
    } catch (err: any) {
      logger.error('Failed to approve trainer request', err)
      const statusCode = err.message.includes('not found') ? 404 : 500
      res
        .status(statusCode)
        .send({ err: err.message || 'Failed to approve trainer request' })
    }
  }

  static async rejectRequest(req: Request, res: Response) {
    try {
      const requestId = req.params.id
      const rejectedRequest = await TrainerRequestService.reject(requestId)
      res.json(rejectedRequest)
    } catch (err: any) {
      logger.error('Failed to reject trainer request', err)
      const statusCode = err.message.includes('not found') ? 404 : 500
      res
        .status(statusCode)
        .send({ err: err.message || 'Failed to reject trainer request' })
    }
  }

  static async deleteRequest(req: Request, res: Response) {
    try {
      const requestId = req.params.id
      await TrainerRequestService.remove(requestId)
      res.send({ msg: 'Trainer request deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete trainer request', err)
      const statusCode = err.message.includes('not found') ? 404 : 500
      res
        .status(statusCode)
        .send({ err: err.message || 'Failed to delete trainer request' })
    }
  }
}
