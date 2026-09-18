import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '../../../services/logger.service'
import { getAiLogPrompt } from './ai-log.prompt'
import { aiLogResponseSchema } from './ai-log.schema'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export interface AiLogGeminiItem {
  name: string
  gramsMin: number
  gramsMax: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
}

export interface AiLogGeminiResult {
  mode: 'meal' | 'custom' | 'cant_figure'
  name: string
  includeOil: boolean
  items: AiLogGeminiItem[]
}

interface RawItem {
  name?: unknown
  gramsMin?: unknown
  gramsMax?: unknown
  proteinPer100g?: unknown
  carbsPer100g?: unknown
  fatPer100g?: unknown
}

interface RawResult {
  mode?: unknown
  name?: unknown
  includeOil?: unknown
  items?: unknown
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

function parseItem(raw: RawItem): AiLogGeminiItem | null {
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const gramsMin = Number(raw.gramsMin)
  const gramsMax = Number(raw.gramsMax)
  const proteinPer100g = Number(raw.proteinPer100g)
  const carbsPer100g = Number(raw.carbsPer100g)
  const fatPer100g = Number(raw.fatPer100g)
  if (!name) return null
  if (![gramsMin, gramsMax, proteinPer100g, carbsPer100g, fatPer100g].every(Number.isFinite)) {
    return null
  }
  const min = Math.max(1, Math.min(gramsMin, gramsMax))
  const max = Math.max(min, Math.max(gramsMin, gramsMax))
  return {
    name,
    gramsMin: Math.round(min),
    gramsMax: Math.round(max),
    proteinPer100g: Math.max(0, proteinPer100g),
    carbsPer100g: Math.max(0, carbsPer100g),
    fatPer100g: Math.max(0, fatPer100g),
  }
}

function parseResult(raw: RawResult): AiLogGeminiResult {
  const mode =
    raw.mode === 'meal' || raw.mode === 'custom' || raw.mode === 'cant_figure'
      ? raw.mode
      : 'custom'
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Meal'
  const includeOil = raw.includeOil === true
  const items = Array.isArray(raw.items)
    ? raw.items
        .map((item) => parseItem(item as RawItem))
        .filter((item): item is AiLogGeminiItem => !!item)
    : []

  if (mode === 'cant_figure') {
    return { mode, name, includeOil: false, items: [] }
  }
  if (mode === 'meal' && items.length < 2) {
    return {
      mode: 'custom',
      name,
      includeOil,
      items: items.length
        ? items
        : [
            {
              name,
              gramsMin: 200,
              gramsMax: 400,
              proteinPer100g: 10,
              carbsPer100g: 20,
              fatPer100g: 8,
            },
          ],
    }
  }
  if (!items.length) {
    return {
      mode: 'custom',
      name,
      includeOil,
      items: [
        {
          name,
          gramsMin: 150,
          gramsMax: 350,
          proteinPer100g: 10,
          carbsPer100g: 20,
          fatPer100g: 8,
        },
      ],
    }
  }
  return { mode, name, includeOil, items }
}

export class AiLogGeminiService {
  static async estimate(
    imageUrl: string | undefined,
    text: string | undefined
  ): Promise<AiLogGeminiResult> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: getAiLogPrompt(text || '') },
    ]

    if (imageUrl) {
      const imageData = await fetchImageAsBase64(imageUrl)
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      })
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: aiLogResponseSchema,
      },
    })

    const result = await model.generateContent(parts)
    const textResult = result.response.text()
    if (!textResult) {
      throw new Error('Empty response from Gemini')
    }

    let parsed: RawResult
    try {
      parsed = JSON.parse(textResult) as RawResult
    } catch (err) {
      logger.error('Failed to parse AI log Gemini JSON', err, textResult)
      throw new Error('Invalid JSON from Gemini')
    }

    return parseResult(parsed)
  }
}
