import { ItemService } from '../item/item.service'
import { IItem } from '../item/item.model'
import { logger } from '../../services/logger.service'
import { AiLogGeminiItem, AiLogGeminiService } from './gemini/ai-log.gemini'

function itemDisplayName(name: IItem['name']) {
  if (!name) return ''
  if (typeof name === 'string') return name
  return name.default || name.eng || name.he || ''
}

function caloriesFromMacros(protein: number, carbs: number, fat: number) {
  return Math.round(protein * 4 + carbs * 4 + fat * 9)
}

function per100g(item: AiLogGeminiItem) {
  return {
    calories: caloriesFromMacros(
      item.proteinPer100g,
      item.carbsPer100g,
      item.fatPer100g
    ),
    protein: item.proteinPer100g,
    carbs: item.carbsPer100g,
    fat: item.fatPer100g,
  }
}

function toClientItem(item: IItem) {
  return {
    _id: item._id,
    name: item.name,
    searchId: item.searchId,
    image: item.image,
    macros: item.macros,
    type: item.type,
    categories: item.categories,
    unit: item.unit,
  }
}

const COOKING_NOISE =
  /^(grilled|fried|cooked|steamed|baked|roasted|boiled|sauteed|sautéed|fresh|sliced|chopped|raw|with|and|the|a|an|of|in|on|מטוגן|מבושל|קלוי|עם)$/i

function catalogQueries(name: string) {
  const cleaned = name
    .replace(/\(.*?\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = cleaned
    .split(' ')
    .filter((word) => word.length > 1 && !COOKING_NOISE.test(word))
  const queries = [cleaned]
  const joined = words.join(' ')
  if (joined && joined !== cleaned) queries.push(joined)
  if (words.length >= 2) queries.push(words.slice(0, 2).join(' '))
  queries.push(...[...words].sort((a, b) => b.length - a.length))
  return [...new Set(queries.filter(Boolean))]
}

async function matchCatalog(name: string, userId?: string) {
  try {
    for (const query of catalogQueries(name)) {
      const hits = await ItemService.getBySearchTerm(query, userId)
      const hit = hits.find((item) => item?.macros && item.type !== 'meal')
      if (hit) return hit
    }
  } catch (err) {
    logger.error('AiLogService.matchCatalog failed', err)
  }
  return null
}

async function findOil(userId?: string) {
  const queries = ['olive oil', 'oil', 'שמן זית', 'שמן']
  for (const query of queries) {
    const hit = await matchCatalog(query, userId)
    if (hit) return hit
  }
  return null
}

export class AiLogService {
  static async estimate(input: {
    userId?: string
    imageUrl?: string
    text?: string
  }) {
    const imageUrl = input.imageUrl?.trim() || undefined
    const text = input.text?.trim() || undefined
    if (!imageUrl && !text) {
      const err = new Error('imageUrl or text is required') as Error & {
        statusCode?: number
      }
      err.statusCode = 400
      throw err
    }

    const gemini = await AiLogGeminiService.estimate(imageUrl, text)

    if (gemini.mode === 'cant_figure') {
      return { mode: 'cant_figure', name: '', items: [] }
    }

    const lines = []
    for (const item of gemini.items) {
      let catalog

      if (gemini.mode !== 'custom') {
        catalog = await matchCatalog(item.name, input.userId)
      }

      if (catalog?.macros && gemini.mode !== 'custom') {
        lines.push({
          name: itemDisplayName(catalog.name) || item.name,
          gramsMin: item.gramsMin,
          gramsMax: item.gramsMax,
          per100g: {
            calories: catalog.macros.calories,
            protein: catalog.macros.protein,
            carbs: catalog.macros.carbs,
            fat: catalog.macros.fat,
          },
          source: 'catalog',
          item: toClientItem(catalog),
        })
      } else if (gemini.mode === 'custom') {
        lines.push({
          name: item.name,
          gramsMin: item.gramsMin,
          gramsMax: item.gramsMax,
          per100g: per100g(item),
          source: 'custom',
        })
      }
    }

    if (gemini.includeOil) {
      const oil = await findOil(input.userId)
      lines.push({
        name: itemDisplayName(oil?.name || 'Oil'),
        gramsMin: 10,
        gramsMax: 20,
        per100g: oil?.macros
          ? {
              calories: oil.macros.calories,
              protein: oil.macros.protein,
              carbs: oil.macros.carbs,
              fat: oil.macros.fat,
            }
          : {
              calories: caloriesFromMacros(0, 0, 100),
              protein: 0,
              carbs: 0,
              fat: 100,
            },
        source: 'oil' as const,
        item: oil ? toClientItem(oil) : undefined,
      })
    }

    return {
      mode: gemini.mode,
      name: gemini.name,
      imageUrl,
      items: lines,
    }
  }
}
