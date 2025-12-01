import { TrainerRequest, ITrainerRequest } from './trainer-request.model'
import { User } from '../user/user.model'
import { logger } from '../../services/logger.service'
import mongoose from 'mongoose'
import { UserService } from '../user/user.service'

export class TrainerRequestService {
  static async query(filterBy: any = {}) {
    try {
      const requests = await TrainerRequest.find(filterBy)
      return requests
    } catch (err) {
      logger.error('Failed to query trainer requests', err)
      throw err
    }
  }

  static async getById(requestId: string) {
    try {
      const request = await TrainerRequest.findById(requestId)
      return request
    } catch (err) {
      logger.error(`Failed to get trainer request ${requestId}`, err)
      throw err
    }
  }

  static async getByTrainerId(trainerId: string) {
    try {
      const requests = await TrainerRequest.aggregate([
        { $match: { trainerId } },
        { $addFields: { traineeObjectId: { $toObjectId: '$traineeId' } } },
        {
          $lookup: {
            from: 'users',
            localField: 'traineeObjectId',
            foreignField: '_id',
            as: 'trainee',
          },
        },
        { $addFields: { trainee: { $arrayElemAt: ['$trainee', 0] } } },
        {
          $project: {
            _id: 1,
            traineeId: 1,
            trainee: 1,
            status: 1,
            trainerId: 1,
          },
        },
      ])
      return requests
    } catch (err) {
      logger.error(
        `Failed to get trainer requests for trainer ${trainerId}`,
        err
      )
      throw err
    }
  }

  static async getByTraineeId(traineeId: string) {
    try {
      const requests = await TrainerRequest.find({ traineeId })
      return requests
    } catch (err) {
      logger.error(
        `Failed to get trainer requests for trainee ${traineeId}`,
        err
      )
      throw err
    }
  }

  static async getPendingByTrainerId(trainerId: string) {
    try {
      const requests = await TrainerRequest.find({
        trainerId,
        status: 'pending',
      })
      return requests
    } catch (err) {
      logger.error(
        `Failed to get pending trainer requests for trainer ${trainerId}`,
        err
      )
      throw err
    }
  }

  static async getPendingByTraineeId(traineeId: string) {
    try {
      const requests = await TrainerRequest.find({
        traineeId,
        status: 'pending',
      })
      return requests
    } catch (err) {
      logger.error(
        `Failed to get pending trainer requests for trainee ${traineeId}`,
        err
      )
      throw err
    }
  }

  static async create(request: Partial<ITrainerRequest>) {
    try {
      // Validate that trainer exists and is actually a trainer

      console.log('request', request)
      const trainerId = request.trainerId
      const traineeId = request.traineeId

      if (!trainerId || !traineeId) {
        throw new Error('Could not create request')
      }

      const trainer = await UserService.getById(trainerId)

      if (!trainer) {
        throw new Error('Trainer not found')
      }
      if (!trainer.isTrainer) {
        throw new Error('User is not a trainer')
      }

      // Validate that trainee exists
      const trainee = await UserService.getById(traineeId)
      if (!trainee) {
        throw new Error('Trainee not found')
      }

      // Prevent self-requests
      if (trainerId === traineeId) {
        throw new Error('Cannot request yourself as a trainer')
      }

      // Check if request already exists
      const existingRequest = await TrainerRequest.findOne({
        trainerId,
        traineeId,
      })

      if (existingRequest) {
        throw new Error('Request already exists')
      }

      const newRequest = await TrainerRequest.create({
        ...request,
        status: 'pending',
      })

      return newRequest
    } catch (err: any) {
      logger.error('Failed to create trainer request', err)
      throw err
    }
  }

  static async approve(requestId: string) {
    try {
      const request = await TrainerRequest.findByIdAndUpdate(
        requestId,
        { status: 'approved' },
        { new: true }
      )

      if (!request) {
        throw new Error('Request not found')
      }

      // Add trainerId to trainee's trainersIds array
      await User.findByIdAndUpdate(request.traineeId, {
        $addToSet: { trainersIds: request.trainerId },
      })

      return request
    } catch (err: any) {
      logger.error(`Failed to approve trainer request ${requestId}`, err)
      throw err
    }
  }

  static async reject(requestId: string) {
    try {
      const request = await TrainerRequest.findByIdAndUpdate(
        requestId,
        { status: 'rejected' },
        { new: true }
      )

      if (!request) {
        throw new Error('Request not found')
      }

      return request
    } catch (err: any) {
      logger.error(`Failed to reject trainer request ${requestId}`, err)
      throw err
    }
  }

  static async remove(requestId: string) {
    try {
      const request = await TrainerRequest.findById(requestId)
      if (!request) {
        throw new Error('Request not found')
      }

      // If request was approved, remove trainerId from trainee's trainersIds
      if (request.status === 'approved') {
        await User.findByIdAndUpdate(request.traineeId, {
          $pull: { trainersIds: request.trainerId },
        })
      }

      await TrainerRequest.findByIdAndDelete(requestId)
    } catch (err: any) {
      logger.error(`Failed to remove trainer request ${requestId}`, err)
      throw err
    }
  }

  static async getByTrainerAndTrainee(trainerId: string, traineeId: string) {
    try {
      const request = await TrainerRequest.findOne({
        trainerId,
        traineeId,
      })
      return request
    } catch (err) {
      logger.error(
        `Failed to get trainer request for trainer ${trainerId} and trainee ${traineeId}`,
        err
      )
      throw err
    }
  }
}
