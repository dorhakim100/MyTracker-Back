import { ItemModel, IItem } from './item.model'
import { logger } from '../../services/logger.service'
import { Item } from '@/types/Item/Item'
import { MealService } from '../meal/meal.service'
import { TranslateService } from '../translate/translate.service'
import { isEnglishWord } from '../../services/utils'

export class ItemService {
  /**
   * Normalizes a search term for consistent caching
   */
  private static normalizeSearchTerm(term: string): string {
    return term.toLowerCase().trim()
  }

  /**
   * Get cached items by search term
   */
  static async getBySearchTerm(searchTerm: string): Promise<IItem[]> {
    try {
      const translateSign = isEnglishWord(searchTerm) ? 'he' : 'en'

      const normalizedTerm = this.normalizeSearchTerm(searchTerm)
      const translatedTerm = await TranslateService.translate(
        normalizedTerm,
        translateSign
      )
      const normalizedTranslatedTerm = this.normalizeSearchTerm(translatedTerm)
      const items = await ItemModel.find({
        $or: [
          // { searchTerm: normalizedTerm },
          // { name: { $regex: normalizedTerm, $options: 'i' } },
          // { searchTerm: normalizedTranslatedTerm },
          // { name: { $regex: normalizedTranslatedTerm, $options: 'i' } },
          { searchTerm: { $regex: normalizedTerm, $options: 'i' } },
          { searchTerm: { $regex: normalizedTranslatedTerm, $options: 'i' } },
        ],
      })

      return items
    } catch (err) {
      logger.error(`Failed to get items by search term ${searchTerm}`, err)
      throw err
    }
  }

  /**
   * Check if a search term has cached results
   */
  static async hasCachedResults(searchTerm: string): Promise<boolean> {
    try {
      const translateSign = isEnglishWord(searchTerm) ? 'he' : 'en'

      const normalizedTerm = this.normalizeSearchTerm(searchTerm)
      const translatedTerm = await TranslateService.translate(
        normalizedTerm,
        translateSign
      )
      const normalizedTranslatedTerm = this.normalizeSearchTerm(translatedTerm)
      const count = await ItemModel.countDocuments({
        $or: [
          // { searchTerm: normalizedTerm },

          { searchTerm: { $regex: normalizedTerm, $options: 'i' } },
          { searchTerm: { $regex: normalizedTranslatedTerm, $options: 'i' } },
          // { name: { $regex: normalizedTerm, $options: 'i' } },
          // { name: { $regex: normalizedTranslatedTerm, $options: 'i' } },
        ],
      })
      return count > 0
    } catch (err) {
      logger.error(`Failed to check cached results for ${searchTerm}`, err)
      throw err
    }
  }

  /**
   * Save items from a search result
   * Only saves items that don't already exist (based on searchId)
   */
  static async saveSearchResults(
    searchTerm: string,
    items: Item[]
  ): Promise<IItem[]> {
    try {
      const normalizedTerm = this.normalizeSearchTerm(searchTerm)

      // Filter out items without searchId
      const itemsWithSearchId = items.filter((item) => item.searchId)

      if (itemsWithSearchId.length === 0) {
        return []
      }

      // Get all searchIds to check
      const searchIds = itemsWithSearchId.map((item) => item.searchId!)

      // Check which items already exist
      const existingItems = await ItemModel.find({
        searchId: { $in: searchIds },
      })

      const existingSearchIds = new Set(
        existingItems.map((item) => item.searchId).filter(Boolean)
      )

      // Filter out items that already exist
      const newItems = itemsWithSearchId.filter(
        (item) => !existingSearchIds.has(item.searchId!)
      )

      if (newItems.length === 0) {
        // All items already exist, return existing items
        return existingItems
      }

      // Save only new items
      const itemsToSave = newItems.map((item) => ({
        ...item,
        searchTerm: normalizedTerm,
      }))

      const savedItems = await ItemModel.insertMany(itemsToSave, {
        ordered: false,
      }).catch((err: any) => {
        // If there are duplicate key errors, that's okay - some items might have been added concurrently
        if (err.code === 11000 || err.name === 'MongoServerError') {
          logger.info(
            `Some items already exist for search term ${searchTerm}, fetching existing ones`
          )
          // Fetch all items (newly saved + existing)
          return ItemModel.find({
            searchId: { $in: searchIds },
          })
        }
        throw err
      })

      // Combine newly saved items with existing items
      const allItems = [
        ...existingItems,
        ...(Array.isArray(savedItems) ? savedItems : []),
      ]

      // Remove duplicates based on searchId
      const uniqueItems = Array.from(
        new Map(allItems.map((item) => [item.searchId, item])).values()
      )

      return uniqueItems
    } catch (err) {
      logger.error(`Failed to save search results for ${searchTerm}`, err)
      throw err
    }
  }

  /**
   * Get item by ID
   */
  static async getById(itemId: string): Promise<IItem | null> {
    try {
      const item = await ItemModel.findById(itemId)
      return item
    } catch (err) {
      logger.error(`Failed to get item ${itemId}`, err)
      throw err
    }
  }

  /**
   * Get item by searchId
   */
  static async getBySearchId(searchId: string): Promise<IItem | null> {
    try {
      const item = await ItemModel.findOne({ searchId })
      return item
    } catch (err) {
      logger.error(`Failed to get item by searchId ${searchId}`, err)
      throw err
    }
  }

  /**
   * Query items with filters
   */
  static async query(filterBy = {}): Promise<IItem[]> {
    try {
      const items = await ItemModel.find(filterBy)
      return items
    } catch (err) {
      logger.error('Failed to query items', err)
      throw err
    }
  }

  /**
   * Search items by name (text search)
   */
  static async searchByName(query: string): Promise<IItem[]> {
    try {
      const items = await ItemModel.find({
        $text: { $search: query },
      })
      return items
    } catch (err) {
      logger.error(`Failed to search items by name ${query}`, err)
      throw err
    }
  }

  /**
   * Add a single item
   */
  static async add(item: Partial<IItem>): Promise<IItem> {
    try {
      if (item.searchTerm) {
        item.searchTerm = this.normalizeSearchTerm(item.searchTerm)
      }
      const addedItem = await ItemModel.create(item)
      return addedItem
    } catch (err) {
      logger.error('Failed to add item', err)
      throw err
    }
  }

  /**
   * Update an item
   */
  static async update(
    itemId: string,
    itemToUpdate: Partial<IItem>
  ): Promise<IItem | null> {
    try {
      if (itemToUpdate.searchTerm) {
        itemToUpdate.searchTerm = this.normalizeSearchTerm(
          itemToUpdate.searchTerm
        )
      }
      const item = await ItemModel.findByIdAndUpdate(itemId, itemToUpdate, {
        new: true,
      })
      return item
    } catch (err) {
      logger.error(`Failed to update item ${itemId}`, err)
      throw err
    }
  }

  /**
   * Remove an item
   */
  static async remove(itemId: string): Promise<void> {
    try {
      await ItemModel.findByIdAndDelete(itemId)
    } catch (err) {
      logger.error(`Failed to remove item ${itemId}`, err)
      throw err
    }
  }

  /**
   * Remove all items for a search term (clear cache)
   */
  static async clearCacheForSearchTerm(searchTerm: string): Promise<void> {
    try {
      const normalizedTerm = this.normalizeSearchTerm(searchTerm)
      await ItemModel.deleteMany({ searchTerm: normalizedTerm })
    } catch (err) {
      logger.error(`Failed to clear cache for search term ${searchTerm}`, err)
      throw err
    }
  }

  /**
   * Get all unique search terms (for cache management)
   */
  static async getCachedSearchTerms(): Promise<string[]> {
    try {
      const searchTerms = await ItemModel.distinct('searchTerm')
      return searchTerms
    } catch (err) {
      logger.error('Failed to get cached search terms', err)
      throw err
    }
  }

  static async getBySearchIdBulk(searchIds: string[]): Promise<IItem[]> {
    try {
      const items = await ItemModel.find({ searchId: { $in: searchIds } })
      return items
    } catch (err) {
      logger.error('Failed to get items by searchId bulk', err)
      throw err
    }
  }
}
