import { Router } from 'express'
import { ItemController } from './item.controller'
import {
  optionalAuth,
  protect,
  requireAuth,
} from '../../middleware/auth.middleware'
import {
  requireDocAccess,
  requireManyDocs,
  requireUserAccess,
} from '../../middleware/user-access.middleware'
import { ItemModel } from './item.model'

const router = Router()

const privateItem = {
  allowMissingOwner: true,
  when: 'ifOwned' as const,
}
const ownItem = requireDocAccess(ItemModel, 'createdBy', {}, privateItem)
const ownItemBySearchId = requireDocAccess(
  ItemModel,
  'createdBy',
  { query: 'searchId', by: 'searchId' },
  privateItem
)
const ownItemsBySearchId = requireManyDocs(
  ItemModel,
  'createdBy',
  { query: 'searchIds', by: 'searchId' },
  privateItem
)
const createdByIfSent = requireUserAccess(
  [{ from: 'body', name: 'createdBy', allowTrainer: false }],
  { when: 'ifPresent' }
)

// Cache-related routes
router.get('/search', optionalAuth, ItemController.getItemsBySearchTerm)
router.get('/search/check', optionalAuth, ItemController.hasCachedResults)
router.post('/search', requireAuth, ItemController.saveSearchResults)
router.delete('/search/cache', requireAuth, ItemController.clearCache)
router.get('/search/terms', ItemController.getCachedSearchTerms)

// Item CRUD routes
router.get('/', optionalAuth, ItemController.getItems)
router.get('/image-native', ownItemBySearchId, ItemController.getImageNative)
router.get('/search-id/bulk', ownItemsBySearchId, ItemController.getItemsBySearchIdBulk)
router.get('/search-id', ownItemBySearchId, ItemController.getItemBySearchId)
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
router.get('/:id', ownItem, ItemController.getItem)
router.post('/', requireAuth, createdByIfSent, ItemController.addItem)
router.put('/:id', requireAuth, ownItem, createdByIfSent, ItemController.updateItem)
router.delete('/:id', requireAuth, ownItem, ItemController.deleteItem)
router.post('/popularity', ItemController.bumpPopularity)

export const itemRoutes = router
