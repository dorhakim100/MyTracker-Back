import { TrainerRequest, ITrainerRequest } from './trainer-request.model'
import { User } from '../user/user.model'
import { logger } from '../../services/logger.service'
import mongoose from 'mongoose'
import { UserService } from '../user/user.service'
import { Weight } from '../weight/weight.model'

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

        {
          $lookup: {
            from: 'goals',
            let: { uid: '$trainee._id' },
            pipeline: [
              {
                $match: { $expr: { $eq: ['$userId', { $toString: '$$uid' }] } },
              },
              { $sort: { startDate: -1 } },
            ],
            as: 'trainee.goals',
          },
        },
        {
          $set: {
            'trainee.currGoal': {
              $first: {
                $filter: {
                  input: '$trainee.goals',
                  as: 'g',
                  cond: { $eq: ['$$g.isSelected', true] },
                },
              },
            },
          },
        },

        // Convert trainee.mealsIds (strings) to ObjectIds for lookup
        {
          $addFields: {
            mealsObjectIds: {
              $filter: {
                input: {
                  $map: {
                    input: { $ifNull: ['$trainee.mealsIds', []] },
                    as: 'id',
                    in: {
                      $switch: {
                        branches: [
                          {
                            case: { $eq: [{ $type: '$$id' }, 'objectId'] },
                            then: '$$id',
                          },
                          {
                            case: { $eq: [{ $type: '$$id' }, 'string'] },
                            then: { $toObjectId: '$$id' },
                          },
                        ],
                        default: null,
                      },
                    },
                  },
                },
                as: 'oid',
                cond: { $ne: ['$$oid', null] },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'meals',
            let: { ids: '$mealsObjectIds' },
            pipeline: [
              { $match: { $expr: { $in: ['$_id', '$$ids'] } } },
              {
                $addFields: { sortIndex: { $indexOfArray: ['$$ids', '$_id'] } },
              },
              { $sort: { sortIndex: 1 } },
              { $project: { sortIndex: 0 } },
            ],
            as: 'meals',
          },
        },
        {
          $set: {
            'trainee.meals': '$meals',
          },
        },
        { $unset: ['mealsObjectIds', 'meals'] },
        {
          $addFields: {
            weightsObjectIds: {
              $filter: {
                input: {
                  $map: {
                    input: { $ifNull: ['$trainee.weightsIds', []] },
                    as: 'id',
                    in: {
                      $switch: {
                        branches: [
                          {
                            case: { $eq: [{ $type: '$$id' }, 'objectId'] },
                            then: '$$id',
                          },
                          {
                            case: { $eq: [{ $type: '$$id' }, 'string'] },
                            then: { $toObjectId: '$$id' },
                          },
                        ],
                        default: null,
                      },
                    },
                  },
                },
                as: 'oid',
                cond: { $ne: ['$$oid', null] },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'weights',
            // Define uid as the user's ObjectId as a string
            let: { uid: { $toString: '$_id' } },
            pipeline: [
              // Match let variable uid with userId, must be $expr and $eq
              { $match: { $expr: { $eq: ['$userId', '$$uid'] } } },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: '_lastWeight',
          },
        },
        { $set: { lastWeight: { $first: '$_lastWeight' } } },
        {
          $project: {
            trainee: {
              goalsIds: 0,
              weightsIds: 0,
              mealsIds: 0,
              weightIds: 0,
            },
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
      const requests = await TrainerRequest.aggregate([
        { $match: { traineeId } },
        { $addFields: { trainerObjectId: { $toObjectId: '$trainerId' } } },
        {
          $lookup: {
            from: 'users',
            localField: 'trainerObjectId',
            foreignField: '_id',
            as: 'trainer',
          },
        },
        { $addFields: { trainer: { $arrayElemAt: ['$trainer', 0] } } },
        {
          $project: {
            _id: 1,
            trainerId: 1,
            trainer: 1,
            status: 1,
            traineeId: 1,
          },
        },
      ])
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
