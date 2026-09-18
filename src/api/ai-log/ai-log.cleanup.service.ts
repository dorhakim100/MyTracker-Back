import { Log } from '../log/log.model'
import { CloudinaryMediaService } from '../../services/cloudinary/cloudinary.service'
import { logger } from '../../services/logger.service'

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

export class AiPlateCleanupService {
  static async purgeExpired(): Promise<{
    found: number
    cloudinaryDeleted: number
    logsCleared: number
  }> {
    const cutoff = Date.now() - TWO_DAYS_MS
    const logs = await Log.find({
      aiPlate: true,
      image: { $nin: [null, ''] },
      time: { $lt: cutoff },
    }).lean()

    const imageUrls = [
      ...new Set(
        logs
          .map((doc) => doc.image)
          .filter((url): url is string => typeof url === 'string' && url.length > 0)
      ),
    ]

    logger.info(
      `AiPlateCleanupService: starting (${logs.length} logs, ${imageUrls.length} urls)`
    )

    const cloudinaryResult =
      await CloudinaryMediaService.destroyImagesByDeliveryUrls(imageUrls)

    const mongoResult = await Log.updateMany(
      {
        aiPlate: true,
        time: { $lt: cutoff },
      },
      { $set: { image: '', aiPlate: false } }
    )

    const result = {
      found: logs.length,
      cloudinaryDeleted: cloudinaryResult.deleted,
      logsCleared: mongoResult.modifiedCount ?? 0,
    }

    logger.info('AiPlateCleanupService: complete', result)
    return result
  }
}
