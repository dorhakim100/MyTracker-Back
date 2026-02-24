"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemRoutes = void 0;
const express_1 = require("express");
const item_controller_1 = require("./item.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Cache-related routes
router.get('/search', item_controller_1.ItemController.getItemsBySearchTerm);
router.get('/search/check', item_controller_1.ItemController.hasCachedResults);
router.post('/search', auth_middleware_1.requireAuth, item_controller_1.ItemController.saveSearchResults);
router.delete('/search/cache', auth_middleware_1.requireAuth, item_controller_1.ItemController.clearCache);
router.get('/search/terms', item_controller_1.ItemController.getCachedSearchTerms);
// Item CRUD routes
router.get('/', item_controller_1.ItemController.getItems);
router.get('/image-native', item_controller_1.ItemController.getImageNative);
router.get('/search-id/bulk', item_controller_1.ItemController.getItemsBySearchIdBulk);
router.get('/search-id', item_controller_1.ItemController.getItemBySearchId);
router.get('/search-name', item_controller_1.ItemController.searchItems);
router.get('/:id', item_controller_1.ItemController.getItem);
router.post('/', auth_middleware_1.requireAuth, item_controller_1.ItemController.addItem);
router.put('/:id', auth_middleware_1.requireAuth, item_controller_1.ItemController.updateItem);
router.delete('/:id', auth_middleware_1.requireAuth, item_controller_1.ItemController.deleteItem);
exports.itemRoutes = router;
