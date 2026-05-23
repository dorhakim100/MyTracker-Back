import { v2 as cloudinary } from 'cloudinary'
import { isValidCloudinaryUrl } from '../../api/body-fat/body-fat.validation'
import { logger } from '../logger.service'

const DELETE_RESOURCES_BATCH_SIZE = 100

export interface CloudinaryDestroyBatchResult {
  attempted: number
  deleted: number
  failed: number
  skippedInvalidUrls: number
}

function isConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  )
}

function configureCloudinary(): void {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

function isTransformationSegment(segment: string): boolean {
  if (/^v\d+$/.test(segment)) {
    return true
  }
  if (segment.includes(',')) {
    return true
  }
  if (/^[a-z]{1,3}_[\w,.]+$/.test(segment)) {
    return true
  }
  return false
}

export function extractPublicIdFromCloudinaryUrl(url: string): string | null {
  if (!isValidCloudinaryUrl(url)) {
    return null
  }

  try {
    const parsed = new URL(url)
    const uploadMarker = '/upload/'
    const uploadIndex = parsed.pathname.indexOf(uploadMarker)
    if (uploadIndex === -1) {
      return null
    }

    const segments = parsed.pathname
      .slice(uploadIndex + uploadMarker.length)
      .split('/')
      .filter(Boolean)

    while (segments.length > 0 && isTransformationSegment(segments[0])) {
      segments.shift()
    }

    if (segments.length === 0) {
      return null
    }

    const publicIdWithExt = segments.join('/')
    return publicIdWithExt.replace(/\.[^/.]+$/, '')
  } catch {
    return null
  }
}

function countDeletedFromBatchResponse(
  result: Record<string, string> | undefined
): { deleted: number; failed: number } {
  if (!result) {
    return { deleted: 0, failed: 0 }
  }

  let deleted = 0
  let failed = 0

  for (const status of Object.values(result)) {
    if (status === 'deleted' || status === 'not_found') {
      deleted += 1
    } else {
      failed += 1
    }
  }

  return { deleted, failed }
}

export class CloudinaryMediaService {
  static isConfigured(): boolean {
    return isConfigured()
  }

  static async destroyImagesByDeliveryUrls(
    imageUrls: string[]
  ): Promise<CloudinaryDestroyBatchResult> {
    if (!isConfigured()) {
      logger.warn(
        'CloudinaryMediaService: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is missing; skipping image deletes'
      )
      return {
        attempted: 0,
        deleted: 0,
        failed: 0,
        skippedInvalidUrls: 0,
      }
    }

    configureCloudinary()

    const publicIds: string[] = []
    let skippedInvalidUrls = 0

    for (const url of imageUrls) {
      const publicId = extractPublicIdFromCloudinaryUrl(url)
      if (!publicId) {
        skippedInvalidUrls += 1
        logger.warn('CloudinaryMediaService: could not parse public_id from URL', url)
        continue
      }
      publicIds.push(publicId)
    }

    const uniquePublicIds = [...new Set(publicIds)]
    let deleted = 0
    let failed = 0

    for (let i = 0; i < uniquePublicIds.length; i += DELETE_RESOURCES_BATCH_SIZE) {
      const batch = uniquePublicIds.slice(i, i + DELETE_RESOURCES_BATCH_SIZE)

      try {
        const response = await cloudinary.api.delete_resources(batch, {
          resource_type: 'image',
          type: 'upload',
        })
        const counts = countDeletedFromBatchResponse(response.deleted)
        deleted += counts.deleted
        failed += counts.failed
      } catch (err) {
        failed += batch.length
        logger.error('CloudinaryMediaService: delete_resources batch failed', err)
      }
    }

    return {
      attempted: uniquePublicIds.length,
      deleted,
      failed,
      skippedInvalidUrls,
    }
  }
}
