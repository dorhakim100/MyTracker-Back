import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { ItemService } from '../api/item/item.service'

dotenv.config()

async function main() {
  const catalogPath =
    process.argv[2] ||
    path.resolve(
      __dirname,
      '../../../MyTracker-Front/playground/data/catalog.json'
    )

  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Catalog not found at ${catalogPath}`)
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
  const items = catalog.items || catalog
  if (!Array.isArray(items)) {
    throw new Error('Catalog JSON must include an items array')
  }

  const uri = process.env.MONGO_URL as string
  const dbName = process.env.DB_NAME
  await mongoose.connect(uri, { dbName })

  const result = await ItemService.applyCatalog(items)
  console.log('Applied catalog', result)

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
