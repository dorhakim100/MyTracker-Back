import { logger } from '../../services/logger.service'
import { v2 as GoogleTranslate } from '@google-cloud/translate'
import { LRUCache } from 'lru-cache'

import { Translate as TranslateItemType } from '@/types/Translate/Translate'

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')
const projectId = process.env.GOOGLE_PROJECT_ID

const translateClient = new GoogleTranslate.Translate({
  credentials: {
    client_email: clientEmail!,
    private_key: privateKey,
  },
  projectId: projectId,
})

const cache = new LRUCache<string, TranslateItemType>({
  max: 20000,
  ttl: 180 * 24 * 60 * 60 * 1000, // 180 days
  updateAgeOnGet: true, // sliding TTL
  ttlAutopurge: true,
})

const stripNiqqud = (s: string) =>
  s.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '')

const normKey = (q: string, target: string) => {
  const cleaned = stripNiqqud(q).trim().replace(/\s+/g, ' ').toLowerCase()
  return `${cleaned}::${target}`
}

export class TranslateService {
  static async translate(q: string, target = 'en') {
    try {
      const key = normKey(q, target)

      const cached = cache.get(key)

      if (cached) return cached.value

      const [translated] = await translateClient.translate(q, target)

      const newTranslate: TranslateItemType = { key: key, value: translated }
      cache.set(key, newTranslate)
      return newTranslate.value
    } catch (err) {
      logger.error('Failed to translate', err)
      throw err
    }
  }
}
