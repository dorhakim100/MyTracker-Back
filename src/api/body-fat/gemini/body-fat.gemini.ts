import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '../../../services/logger.service'
import { clampBodyFatRange } from '../body-fat.validation'
import { getPrompt } from './body-fat.prompt'
import { bodyFatResponseSchema } from './body-fat.schema'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export interface BodyFatGeminiResult {
  minPercent: number
  maxPercent: number
  note: string
}

interface RawGeminiEstimate {
  minPercent?: unknown
  maxPercent?: unknown
  note?: unknown
}

async function fetchImageAsBase64(
  imageUrl: string
): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) })

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const mimeType = contentType.split(';')[0].trim()
  if (!mimeType.startsWith('image/')) {
    throw new Error('URL did not return an image')
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Image too large')
  }

  return { base64: buffer.toString('base64'), mimeType }
}

function parseGeminiEstimate(raw: RawGeminiEstimate): BodyFatGeminiResult {
  const minPercent = Number(raw.minPercent)
  const maxPercent = Number(raw.maxPercent)
  const note = typeof raw.note === 'string' ? raw.note.trim() : ''

  if (
    !Number.isFinite(minPercent) ||
    !Number.isFinite(maxPercent) ||
    !note
  ) {
    throw new Error('Invalid structured response from Gemini')
  }

  const clamped = clampBodyFatRange(minPercent, maxPercent)
  return { ...clamped, note }
}

export class BodyFatGeminiService {
  static async estimateFromImageUrl(
    imageUrl: string,
    weightKg: number
  ): Promise<BodyFatGeminiResult> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const imageData = await fetchImageAsBase64(imageUrl)

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: bodyFatResponseSchema,
      },
    })

    const result = await model.generateContent([
      { text: getPrompt(weightKg) },
      {
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      },
    ])



    const text = result.response.text()
    if (!text) {
      throw new Error('Empty response from Gemini')
    }

    let parsed: RawGeminiEstimate
    try {
      parsed = JSON.parse(text) as RawGeminiEstimate
    } catch (err) {
      logger.error('Failed to parse Gemini JSON', err, text)
      throw new Error('Invalid JSON from Gemini')
    }

    return parseGeminiEstimate(parsed)
  }
}
