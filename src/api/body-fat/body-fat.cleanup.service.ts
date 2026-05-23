import { BodyFatEstimate } from './body-fat.model'
import { CloudinaryMediaService } from '../../services/cloudinary/cloudinary.service'
import { logger } from '../../services/logger.service'

export interface BodyFatCleanupResult {
  estimatesFound: number
  uniqueImageUrls: number
  cloudinaryAttempted: number
  cloudinaryDeleted: number
  cloudinaryFailed: number
  skippedInvalidUrls: number
  mongoDeleted: number
}

export class BodyFatCleanupService {
  static async purgeAll(): Promise<BodyFatCleanupResult> {
    const estimates = await BodyFatEstimate.find({}, { imageUrl: 1 }).lean()
    const imageUrls = [
      ...new Set(
        estimates
          .map((doc) => doc.imageUrl)
          .filter((url): url is string => typeof url === 'string' && url.length > 0)
      ),
    ]

    logger.info(
      `BodyFatCleanupService: starting purge (${estimates.length} estimates, ${imageUrls.length} unique image URLs)`
    )

    const cloudinaryResult =
      await CloudinaryMediaService.destroyImagesByDeliveryUrls(imageUrls)

    const mongoResult = await BodyFatEstimate.deleteMany({})

    const result: BodyFatCleanupResult = {
      estimatesFound: estimates.length,
      uniqueImageUrls: imageUrls.length,
      cloudinaryAttempted: cloudinaryResult.attempted,
      cloudinaryDeleted: cloudinaryResult.deleted,
      cloudinaryFailed: cloudinaryResult.failed,
      skippedInvalidUrls: cloudinaryResult.skippedInvalidUrls,
      mongoDeleted: mongoResult.deletedCount ?? 0,
    }

    logger.info('BodyFatCleanupService: purge complete', result)

    return result
  }
}
