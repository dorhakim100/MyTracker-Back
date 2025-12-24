import { IItem, ItemModel } from '@/api/item/item.model'
import { logger } from '../logger.service'

async function removeDuplicateItems() {
  try {
    const items: IItem[] = await ItemModel.find({})

    const searchIds = items
      .map((item) => item.searchId)
      .filter((id): id is string => Boolean(id))
    const uniqueSearchIds = new Set<string>(searchIds)
    const uniqueSearchIdsArray = Array.from(uniqueSearchIds)

    console.log('uniqueSearchIds', uniqueSearchIdsArray)
    console.log('total items', items.length)
    console.log('unique count', uniqueSearchIdsArray.length)

    const duplicatesIds = searchIds.filter((id) => {
      return searchIds.filter((i) => i === id).length > 1
    })

    console.log('duplicatesIds', duplicatesIds.length)
    let deletedCount = 0

    duplicatesIds.forEach(async (id) => {
      const items = await ItemModel.find({ searchId: id })
      console.log('items', items)
      if (items.length > 1) {
        let counter = items.length
        items.forEach(async (item) => {
          if (counter > 1) {
            await ItemModel.deleteOne({ searchId: id })
            counter--
            deletedCount++
          }
        })
      }
    })
    console.log('deletedCount', deletedCount)
  } catch (error) {
    logger.error('Error removing duplicate items', error)
  }
}
