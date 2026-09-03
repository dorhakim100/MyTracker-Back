import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { ItemModel } from '../api/item/item.model'

dotenv.config()

// One-off: the item `groups` field was renamed to `categories`. Run this once
// against each environment before deploying the code that reads `categories`.
async function main() {
  const uri = process.env.MONGO_URL as string
  const dbName = process.env.DB_NAME
  await mongoose.connect(uri, { dbName })

  const collection = ItemModel.collection

  const renamed = await collection.updateMany({ groups: { $exists: true } }, {
    $rename: { groups: 'categories' },
  })
  console.log(`Renamed groups -> categories on ${renamed.modifiedCount} items`)

  // Mongoose rebuilds the categories indexes on boot; the old ones would linger.
  const indexes = await collection.indexes()
  for (const index of indexes) {
    if (!index.name || !('groups' in index.key)) continue
    await collection.dropIndex(index.name)
    console.log(`Dropped stale index ${index.name}`)
  }

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
