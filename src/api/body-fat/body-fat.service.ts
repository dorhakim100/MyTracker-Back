import { BodyFatEstimate, IBodyFatEstimate } from './body-fat.model'
import { BodyFatGeminiService } from './gemini/body-fat.gemini'
import { logger } from '../../services/logger.service'

export class BodyFatService {
  static async estimate(userId: string, imageUrl: string, weightKg: number) {
    if (!userId) {
      throw new Error('userId is required')
    }

    if (!imageUrl) {
      throw new Error('imageUrl is required')
    }

    let geminiResult
    try {
      geminiResult = await BodyFatGeminiService.estimateFromImageUrl(imageUrl, weightKg)
    } catch (err) {
      logger.error('BodyFatGeminiService.estimateFromImageUrl failed', err)
      throw new Error('Failed to analyze image')
    }

    try {
      const saved = await BodyFatEstimate.create({
        userId,
        minPercent: geminiResult.minPercent,
        maxPercent: geminiResult.maxPercent,
        note: geminiResult.note,
        imageUrl,
        weightKg,
        createdAt: Date.now(),
      })

      return {...BodyFatService.toResponse(saved), status: 'ok'}
    } catch (err) {
      logger.error('BodyFatService.estimate persist failed', err)
      throw err
    }
  }

  static toResponse(doc: IBodyFatEstimate) {
    return {
      _id: doc._id,
      userId: doc.userId,
      minPercent: doc.minPercent,
      maxPercent: doc.maxPercent,
      note: doc.note,
      imageUrl: doc.imageUrl,
      createdAt: doc.createdAt,
    }
  }
}
