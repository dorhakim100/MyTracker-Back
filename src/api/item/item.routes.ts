import { Router } from 'express'
import { ItemController } from './item.controller'
import {
  optionalAuth,
  protect,
  requireAuth,
} from '../../middleware/auth.middleware'

const router = Router()

// Cache-related routes
router.get('/search', optionalAuth, ItemController.getItemsBySearchTerm)
router.get('/search/check', optionalAuth, ItemController.hasCachedResults)
router.post('/search', requireAuth, ItemController.saveSearchResults)
router.delete('/search/cache', requireAuth, ItemController.clearCache)
router.get('/search/terms', ItemController.getCachedSearchTerms)

// Item CRUD routes
router.get('/', optionalAuth, ItemController.getItems)
router.get('/image-native', ItemController.getImageNative)
router.get('/search-id/bulk', ItemController.getItemsBySearchIdBulk)
router.get('/search-id', ItemController.getItemBySearchId)
router.get('/search-name', optionalAuth, ItemController.searchItems)
router.get('/category', optionalAuth, ItemController.listByCategory)
router.get('/categories/counts', optionalAuth, ItemController.getCategoryCounts)
router.post('/create', protect, ItemController.createItem)
router.get('/admin/list', (req, res) => ItemController.playgroundList(req, res))
router.post('/admin/save', (req, res) =>
  ItemController.playgroundSave(req, res)
)
router.delete('/admin/:id', (req, res) =>
  ItemController.playgroundDelete(req, res)
)
router.post('/admin/apply', (req, res) =>
  ItemController.playgroundApply(req, res)
)
router.get('/:id', ItemController.getItem)
router.post('/', requireAuth, ItemController.addItem)
router.put('/:id', requireAuth, ItemController.updateItem)
router.delete('/:id', requireAuth, ItemController.deleteItem)
router.post('/popularity', ItemController.bumpPopularity)

export const itemRoutes = router
