import { Request, Response } from 'express'
import { ItemService } from './item.service'
import { logger } from '../../services/logger.service'

export class ItemController {
  /**
   * Get cached items by search term
   */
  static async getItemsBySearchTerm(req: Request, res: Response) {
    try {
      const { searchTerm } = req.query as { searchTerm: string }

      if (!searchTerm) {
        logger.error('Search term is required')
        return res.status(400).send({ err: 'Search term is required' })
      }

      const items = await ItemService.getBySearchTerm(searchTerm)
      res.json(items)
    } catch (err: any) {
      logger.error('Failed to get items by search term', err)
      res.status(500).send({ err: 'Failed to get items by search term' })
    }
  }

  /**
   * Check if search term has cached results
   */
  static async hasCachedResults(req: Request, res: Response) {
    try {
      const { searchTerm } = req.query
      if (!searchTerm || typeof searchTerm !== 'string') {
        return res.status(400).send({ err: 'Search term is required' })
      }

      const hasCache = await ItemService.hasCachedResults(searchTerm)
      res.json(hasCache)
    } catch (err: any) {
      logger.error('Failed to check cached results', err)
      res.status(500).send({ err: 'Failed to check cached results' })
    }
  }

  /**
   * Save search results (cache items from external API)
   */
  static async saveSearchResults(req: Request, res: Response) {
    try {
      const { searchTerm, items } = req.body

      if (!searchTerm || typeof searchTerm !== 'string') {
        return res.status(400).send({ err: 'Search term is required' })
      }

      if (!items || !Array.isArray(items)) {
        return res.status(400).send({ err: 'Items array is required' })
      }

      const savedItems = await ItemService.saveSearchResults(searchTerm, items)
      res.json(savedItems)
    } catch (err: any) {
      logger.error('Failed to save search results', err)
      res.status(500).send({ err: 'Failed to save search results' })
    }
  }

  /**
   * Get item by ID
   */
  static async getItem(req: Request, res: Response) {
    try {
      const item = await ItemService.getById(req.params.id)
      if (!item) {
        return res.status(404).send({ err: 'Item not found' })
      }
      res.json(item)
    } catch (err: any) {
      logger.error('Failed to get item', err)
      res.status(500).send({ err: 'Failed to get item' })
    }
  }

  /**
   * Get item by searchId
   */
  static async getItemBySearchId(req: Request, res: Response) {
    try {
      const { searchId } = req.query
      if (!searchId || typeof searchId !== 'string') {
        return res.status(400).send({ err: 'SearchId is required' })
      }

      const item = await ItemService.getBySearchId(searchId)
      if (!item) {
        return res.status(404).send({ err: 'Item not found' })
      }
      res.json(item)
    } catch (err: any) {
      logger.error('Failed to get item by searchId', err)
      res.status(500).send({ err: 'Failed to get item by searchId' })
    }
  }

  /**
   * Query items with filters
   */
  static async getItems(req: Request, res: Response) {
    try {
      const items = await ItemService.query(req.query)
      res.json(items)
    } catch (err: any) {
      logger.error('Failed to get items', err)
      res.status(500).send({ err: 'Failed to get items' })
    }
  }

  /**
   * Search items by name
   */
  static async searchItems(req: Request, res: Response) {
    try {
      const { q } = req.query
      if (!q || typeof q !== 'string') {
        return res.status(400).send({ err: 'Query parameter is required' })
      }

      const items = await ItemService.searchByName(q)
      res.json(items)
    } catch (err: any) {
      logger.error('Failed to search items', err)
      res.status(500).send({ err: 'Failed to search items' })
    }
  }

  /**
   * Add a single item
   */
  static async addItem(req: Request, res: Response) {
    try {
      const item = req.body
      delete item._id
      const addedItem = await ItemService.add(item)
      res.json(addedItem)
    } catch (err: any) {
      logger.error('Failed to add item', err)
      res.status(500).send({ err: 'Failed to add item' })
    }
  }

  /**
   * Update an item
   */
  static async updateItem(req: Request, res: Response) {
    try {
      const item = await ItemService.update(req.params.id, req.body)
      if (!item) {
        return res.status(404).send({ err: 'Item not found' })
      }
      res.json(item)
    } catch (err: any) {
      logger.error('Failed to update item', err)
      res.status(500).send({ err: 'Failed to update item' })
    }
  }

  /**
   * Delete an item
   */
  static async deleteItem(req: Request, res: Response) {
    try {
      await ItemService.remove(req.params.id)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete item', err)
      res.status(500).send({ err: 'Failed to delete item' })
    }
  }

  /**
   * Clear cache for a search term
   */
  static async clearCache(req: Request, res: Response) {
    try {
      const { searchTerm } = req.query
      if (!searchTerm || typeof searchTerm !== 'string') {
        return res.status(400).send({ err: 'Search term is required' })
      }

      await ItemService.clearCacheForSearchTerm(searchTerm)
      res.send({ msg: 'Cache cleared successfully' })
    } catch (err: any) {
      logger.error('Failed to clear cache', err)
      res.status(500).send({ err: 'Failed to clear cache' })
    }
  }

  /**
   * Get all cached search terms
   */
  static async getCachedSearchTerms(req: Request, res: Response) {
    try {
      const searchTerms = await ItemService.getCachedSearchTerms()
      res.json(searchTerms)
    } catch (err: any) {
      logger.error('Failed to get cached search terms', err)
      res.status(500).send({ err: 'Failed to get cached search terms' })
    }
  }

  static async getItemsBySearchIdBulk(req: Request, res: Response) {
    try {
      const { searchIds } = req.query as { searchIds: string[] }
      const items = await ItemService.getBySearchIdBulk(searchIds)
      res.json(items)
    } catch (err: any) {
      logger.error('Failed to get items by searchId bulk', err)
      res.status(500).send({ err: 'Failed to get items by searchId bulk' })
    }
  }
}
