import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { ItemModel } from '../api/item/item.model'

dotenv.config()

const DRINK_KEYWORDS = [
  'water',
  'juice',
  'soda',
  'cola',
  'milk',
  'coffee',
  'tea',
  'beer',
  'wine',
  'smoothie',
  'shake',
  'beverage',
  'drink',
  'מים',
  'מיץ',
  'סודה',
  'חלב',
  'קפה',
  'תה',
  'בירה',
  'יין',
  'שייק',
  'משקה',
  'סמוזי',
]

const UNSURE_KEYWORDS = [
  'soup',
  'stew',
  'yogurt',
  'yoghurt',
  'cream',
  'honey',
  'syrup',
  'dressing',
  'mayo',
  'mayonnaise',
  'ice cream',
  'icecream',
  'מרק',
  'יוגורט',
  'שמנת',
  'דבש',
  'סירופ',
  'מיונז',
  'גלידה',
]

const UNSURE_CATEGORIES = ['fatsOils', 'sauces']

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function nameBlob(name: unknown) {
  if (!name) return ''
  if (typeof name === 'string') return normalizeName(name)
  const value = name as { eng?: string; he?: string; default?: string }
  return normalizeName(
    [value.eng, value.he, value.default].filter(Boolean).join(' ')
  )
}

function hasKeyword(blob: string, keywords: string[]) {
  return keywords.some((keyword) => {
    const needle = normalizeName(keyword)
    if (!needle) return false
    if (/[\u0590-\u05FF]/.test(needle)) return blob.includes(needle)
    return new RegExp(`(?:^|\\s)${needle}(?:$|\\s)`).test(` ${blob} `)
  })
}

function classifyItemUnit(item: { name?: unknown; categories?: string[] }) {
  const categories = item.categories || []
  const blob = nameBlob(item.name)

  if (categories.includes('drinks') || hasKeyword(blob, DRINK_KEYWORDS)) {
    return 'ml' as const
  }

  if (
    categories.some((id) => UNSURE_CATEGORIES.includes(id)) ||
    hasKeyword(blob, UNSURE_KEYWORDS)
  ) {
    return undefined
  }

  return 'g' as const
}

async function main() {
  const uri = process.env.MONGO_URL as string
  const dbName = process.env.DB_NAME
  await mongoose.connect(uri, { dbName })

  const items = await ItemModel.find({}).select('_id name categories unit').lean()
  const ops = []
  let ml = 0
  let grams = 0
  let unsure = 0

  for (const item of items) {
    const unit = classifyItemUnit(item)
    if (!unit) {
      unsure += 1
      continue
    }
    if (unit === 'ml') ml += 1
    else grams += 1
    ops.push({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { unit } },
      },
    })
  }

  if (ops.length) {
    await ItemModel.collection.bulkWrite(ops)
  }

  console.log(
    JSON.stringify(
      {
        total: items.length,
        applied: ops.length,
        g: grams,
        ml,
        unsure,
      },
      null,
      2
    )
  )

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
