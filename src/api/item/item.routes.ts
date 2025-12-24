import { Router } from 'express'
import { ItemController } from './item.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

// Cache-related routes
router.get('/search', ItemController.getItemsBySearchTerm)
router.get('/search/check', ItemController.hasCachedResults)
router.post('/search', requireAuth, ItemController.saveSearchResults)
router.delete('/search/cache', requireAuth, ItemController.clearCache)
router.get('/search/terms', ItemController.getCachedSearchTerms)

// Item CRUD routes
router.get('/', ItemController.getItems)
router.get('/search-id/bulk', ItemController.getItemsBySearchIdBulk)
router.get('/search-id', ItemController.getItemBySearchId)
router.get('/search-name', ItemController.searchItems)
router.get('/:id', ItemController.getItem)
router.post('/', requireAuth, ItemController.addItem)
router.put('/:id', requireAuth, ItemController.updateItem)
router.delete('/:id', requireAuth, ItemController.deleteItem)

export const itemRoutes = router
