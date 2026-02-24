"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemController = void 0;
const item_service_1 = require("./item.service");
const logger_service_1 = require("../../services/logger.service");
class ItemController {
    /**
     * Get cached items by search term
     */
    static async getItemsBySearchTerm(req, res) {
        try {
            const { searchTerm } = req.query;
            if (!searchTerm) {
                logger_service_1.logger.error('Search term is required');
                return res.status(400).send({ err: 'Search term is required' });
            }
            const items = await item_service_1.ItemService.getBySearchTerm(searchTerm);
            res.json(items);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get items by search term', err);
            res.status(500).send({ err: 'Failed to get items by search term' });
        }
    }
    /**
     * Check if search term has cached results
     */
    static async hasCachedResults(req, res) {
        try {
            const { searchTerm } = req.query;
            if (!searchTerm || typeof searchTerm !== 'string') {
                return res.status(400).send({ err: 'Search term is required' });
            }
            const hasCache = await item_service_1.ItemService.hasCachedResults(searchTerm);
            res.json(hasCache);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to check cached results', err);
            res.status(500).send({ err: 'Failed to check cached results' });
        }
    }
    /**
     * Save search results (cache items from external API)
     */
    static async saveSearchResults(req, res) {
        try {
            const { searchTerm, items } = req.body;
            if (!searchTerm || typeof searchTerm !== 'string') {
                return res.status(400).send({ err: 'Search term is required' });
            }
            if (!items || !Array.isArray(items)) {
                return res.status(400).send({ err: 'Items array is required' });
            }
            const savedItems = await item_service_1.ItemService.saveSearchResults(searchTerm, items);
            res.json(savedItems);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to save search results', err);
            res.status(500).send({ err: 'Failed to save search results' });
        }
    }
    /**
     * Get item by ID
     */
    static async getItem(req, res) {
        try {
            const item = await item_service_1.ItemService.getById(req.params.id);
            if (!item) {
                return res.status(404).send({ err: 'Item not found' });
            }
            res.json(item);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get item', err);
            res.status(500).send({ err: 'Failed to get item' });
        }
    }
    /**
     * Get item by searchId
     */
    static async getItemBySearchId(req, res) {
        try {
            const { searchId } = req.query;
            if (!searchId || typeof searchId !== 'string') {
                return res.status(400).send({ err: 'SearchId is required' });
            }
            const item = await item_service_1.ItemService.getBySearchId(searchId);
            if (!item) {
                return res.json(null);
            }
            res.json(item);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get item by searchId', err);
            res.status(500).send({ err: 'Failed to get item by searchId' });
        }
    }
    /**
     * Query items with filters
     */
    static async getItems(req, res) {
        try {
            const items = await item_service_1.ItemService.query(req.query);
            res.json(items);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get items', err);
            res.status(500).send({ err: 'Failed to get items' });
        }
    }
    /**
     * Search items by name
     */
    static async searchItems(req, res) {
        try {
            const { q } = req.query;
            if (!q || typeof q !== 'string') {
                return res.status(400).send({ err: 'Query parameter is required' });
            }
            const items = await item_service_1.ItemService.searchByName(q);
            res.json(items);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to search items', err);
            res.status(500).send({ err: 'Failed to search items' });
        }
    }
    /**
     * Add a single item
     */
    static async addItem(req, res) {
        try {
            const item = req.body;
            delete item._id;
            const addedItem = await item_service_1.ItemService.add(item);
            res.json(addedItem);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add item', err);
            res.status(500).send({ err: 'Failed to add item' });
        }
    }
    /**
     * Update an item
     */
    static async updateItem(req, res) {
        try {
            const item = await item_service_1.ItemService.update(req.params.id, req.body);
            if (!item) {
                return res.status(404).send({ err: 'Item not found' });
            }
            res.json(item);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to update item', err);
            res.status(500).send({ err: 'Failed to update item' });
        }
    }
    /**
     * Delete an item
     */
    static async deleteItem(req, res) {
        try {
            await item_service_1.ItemService.remove(req.params.id);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete item', err);
            res.status(500).send({ err: 'Failed to delete item' });
        }
    }
    /**
     * Clear cache for a search term
     */
    static async clearCache(req, res) {
        try {
            const { searchTerm } = req.query;
            if (!searchTerm || typeof searchTerm !== 'string') {
                return res.status(400).send({ err: 'Search term is required' });
            }
            await item_service_1.ItemService.clearCacheForSearchTerm(searchTerm);
            res.send({ msg: 'Cache cleared successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to clear cache', err);
            res.status(500).send({ err: 'Failed to clear cache' });
        }
    }
    /**
     * Get all cached search terms
     */
    static async getCachedSearchTerms(req, res) {
        try {
            const searchTerms = await item_service_1.ItemService.getCachedSearchTerms();
            res.json(searchTerms);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get cached search terms', err);
            res.status(500).send({ err: 'Failed to get cached search terms' });
        }
    }
    static async getItemsBySearchIdBulk(req, res) {
        try {
            const { searchIds } = req.query;
            const items = await item_service_1.ItemService.getBySearchIdBulk(searchIds);
            res.json(items);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get items by searchId bulk', err);
            res.status(500).send({ err: 'Failed to get items by searchId bulk' });
        }
    }
    static async getImageNative(req, res) {
        try {
            const { searchId } = req.query;
            const imageNative = await item_service_1.ItemService.getImageNative(searchId);
            res.json(imageNative);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get image native', err);
            res.status(500).send({ err: 'Failed to get image native' });
        }
    }
}
exports.ItemController = ItemController;
