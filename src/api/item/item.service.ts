import { ItemModel, IItem } from './item.model'
import { logger } from '../../services/logger.service'
import { Item } from '@/types/Item/Item'
import { MealService } from '../meal/meal.service'

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
      const normalizedTerm = this.normalizeSearchTerm(searchTerm)
      const items = await ItemModel.find({
        searchTerm: normalizedTerm,
        name: { $regex: searchTerm, $options: 'i' },
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
      const normalizedTerm = this.normalizeSearchTerm(searchTerm)
      const count = await ItemModel.countDocuments({
        searchTerm: normalizedTerm,
      })
      return count > 0
    } catch (err) {
      logger.error(`Failed to check cached results for ${searchTerm}`, err)
      throw err
    }
  }

  /**
   * Save items from a search result
   */
  static async saveSearchResults(
    searchTerm: string,
    items: Item[]
  ): Promise<IItem[]> {
    try {
      const normalizedTerm = this.normalizeSearchTerm(searchTerm)

      // Process all items in parallel with Promise.allSettled
      const results = await Promise.allSettled(
        items.map(async (item) => {
          try {
            const itemToSave = {
              ...item,
              searchTerm: normalizedTerm,
            }
            const savedItem = await ItemModel.create(itemToSave)
            return savedItem
          } catch (err: any) {
            // If duplicate key error, try to find existing item
            if (err.code === 11000 || err.name === 'MongoServerError') {
              const existingItem = await ItemModel.findOne({
                searchTerm: normalizedTerm,
                searchId: item.searchId,
              })
              if (existingItem) {
                return existingItem
              }
            } else {
              // Log other errors
              logger.warn(
                `Failed to save item ${item.name} for search term ${searchTerm}`,
                err
              )
            }
            throw err
          }
        })
      )

      // Extract successfully saved items
      const savedItems = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => (result as PromiseFulfilledResult<IItem>).value)

      return savedItems
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
