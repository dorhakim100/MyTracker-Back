import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { ItemModel } from '../api/item/item.model'
import { classifyItemCategories } from '../api/item/item-categories'

dotenv.config()

async function main() {
  const uri = process.env.MONGO_URL as string
  const dbName = process.env.DB_NAME
  await mongoose.connect(uri, { dbName })

  const items = await ItemModel.find({}, { name: 1, searchTerms: 1 }).lean()
  const ops = items.map((item) => {
    const categories = classifyItemCategories(item)
    return {
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { categories } },
      },
    }
  })

  const empty = ops.filter((op) => {
    const categories = (op.updateOne.update as { $set: { categories: string[] } }).$set
      .categories
    return !categories.length
  }).length

  if (ops.length) {
    await ItemModel.collection.bulkWrite(ops, { ordered: false })
  }

  console.log(`Backfilled categories on ${ops.length} items (${empty} left empty)`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
