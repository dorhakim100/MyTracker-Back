"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemService = void 0;
const item_model_1 = require("./item.model");
const logger_service_1 = require("../../services/logger.service");
const meal_service_1 = require("../meal/meal.service");
const translate_service_1 = require("../translate/translate.service");
const utils_1 = require("../../services/utils");
class ItemService {
    /**
     * Normalizes a search term for consistent caching
     */
    static normalizeSearchTerm(term) {
        return term.toLowerCase().trim();
    }
    static escapeRegex(term) {
        return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Get cached items by search term
     */
    static async getBySearchTerm(searchTerm) {
        try {
            const translateSign = (0, utils_1.isEnglishWord)(searchTerm) ? 'he' : 'en';
            const normalizedTerm = this.normalizeSearchTerm(searchTerm);
            const translatedTerm = await translate_service_1.TranslateService.translate(normalizedTerm, translateSign);
            const normalizedTranslatedTerm = this.normalizeSearchTerm(translatedTerm);
            const items = await item_model_1.ItemModel.find({
                $or: [
                    {
                        searchTerm: {
                            $elemMatch: {
                                $regex: this.escapeRegex(normalizedTerm),
                                $options: 'i',
                            },
                        },
                    },
                    {
                        searchTerm: {
                            $elemMatch: {
                                $regex: this.escapeRegex(normalizedTranslatedTerm),
                                $options: 'i',
                            },
                        },
                    },
                    { name: { $regex: this.escapeRegex(normalizedTerm), $options: 'i' } },
                    {
                        name: {
                            $regex: this.escapeRegex(normalizedTranslatedTerm),
                            $options: 'i',
                        },
                    },
                ],
            });
            const meals = (await meal_service_1.MealService.query({
                $or: [
                    { name: { $regex: normalizedTerm, $options: 'i' } },
                    { name: { $regex: normalizedTranslatedTerm, $options: 'i' } },
                ],
            }));
            return [...meals, ...items];
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get items by search term ${searchTerm}`, err);
            throw err;
        }
    }
    /**
     * Check if a search term has cached results
     */
    static async hasCachedResults(searchTerm) {
        try {
            const translateSign = (0, utils_1.isEnglishWord)(searchTerm) ? 'he' : 'en';
            const normalizedTerm = this.normalizeSearchTerm(searchTerm);
            const translatedTerm = await translate_service_1.TranslateService.translate(normalizedTerm, translateSign);
            const normalizedTranslatedTerm = this.normalizeSearchTerm(translatedTerm);
            const count = await item_model_1.ItemModel.countDocuments({
                $or: [
                    {
                        searchTerm: {
                            $elemMatch: {
                                $regex: this.escapeRegex(normalizedTerm),
                                $options: 'i',
                            },
                        },
                    },
                    {
                        searchTerm: {
                            $elemMatch: {
                                $regex: this.escapeRegex(normalizedTranslatedTerm),
                                $options: 'i',
                            },
                        },
                    },
                    { name: { $regex: this.escapeRegex(normalizedTerm), $options: 'i' } },
                    {
                        name: {
                            $regex: this.escapeRegex(normalizedTranslatedTerm),
                            $options: 'i',
                        },
                    },
                ],
            });
            return count > 0;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to check cached results for ${searchTerm}`, err);
            throw err;
        }
    }
    /**
     * Save items from a search result
     * Only saves items that don't already exist (based on searchId)
     */
    static async saveSearchResults(searchTerm, items) {
        try {
            const normalizedTerm = this.normalizeSearchTerm(searchTerm);
            // Filter out items without searchId
            const itemsWithSearchId = items.filter((item) => item.searchId);
            if (itemsWithSearchId.length === 0) {
                return [];
            }
            // Get all searchIds to check
            const searchIds = itemsWithSearchId.map((item) => item.searchId);
            // Check which items already exist
            const existingItems = await item_model_1.ItemModel.find({
                searchId: { $in: searchIds },
            });
            const existingSearchIds = new Set(existingItems.map((item) => item.searchId).filter(Boolean));
            // Filter out items that already exist
            const newItems = itemsWithSearchId.filter((item) => !existingSearchIds.has(item.searchId));
            if (newItems.length === 0) {
                // All items already exist, return existing items
                return existingItems;
            }
            // Save only new items
            const itemsToSave = newItems.map((item) => ({
                ...item,
                searchTerm: normalizedTerm,
            }));
            const savedItems = await item_model_1.ItemModel.insertMany(itemsToSave, {
                ordered: false,
            }).catch((err) => {
                // If there are duplicate key errors, that's okay - some items might have been added concurrently
                if (err.code === 11000 || err.name === 'MongoServerError') {
                    logger_service_1.logger.info(`Some items already exist for search term ${searchTerm}, fetching existing ones`);
                    // Fetch all items (newly saved + existing)
                    return item_model_1.ItemModel.find({
                        searchId: { $in: searchIds },
                    });
                }
                throw err;
            });
            // Combine newly saved items with existing items
            const allItems = [
                ...existingItems,
                ...(Array.isArray(savedItems) ? savedItems : []),
            ];
            // Remove duplicates based on searchId
            const uniqueItems = Array.from(new Map(allItems.map((item) => [item.searchId, item])).values());
            return uniqueItems;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to save search results for ${searchTerm}`, err);
            throw err;
        }
    }
    /**
     * Get item by ID
     */
    static async getById(itemId) {
        try {
            const item = await item_model_1.ItemModel.findById(itemId);
            return item;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get item ${itemId}`, err);
            throw err;
        }
    }
    /**
     * Get item by searchId
     */
    static async getBySearchId(searchId) {
        try {
            const item = await item_model_1.ItemModel.findOne({ searchId });
            return item;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get item by searchId ${searchId}`, err);
            throw err;
        }
    }
    /**
     * Query items with filters
     */
    static async query(filterBy = {}) {
        try {
            const items = await item_model_1.ItemModel.find(filterBy);
            return items;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to query items', err);
            throw err;
        }
    }
    /**
     * Search items by name (text search)
     */
    static async searchByName(query) {
        try {
            const items = await item_model_1.ItemModel.find({
                $text: { $search: query },
            });
            return items;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to search items by name ${query}`, err);
            throw err;
        }
    }
    /**
     * Add a single item
     */
    static async add(item) {
        try {
            if (item.searchTerm) {
                item.searchTerm = this.normalizeSearchTerm(item.searchTerm);
            }
            else {
                item.searchTerm = this.normalizeSearchTerm(item.name || '');
            }
            const addedItem = await item_model_1.ItemModel.create(item);
            return addedItem;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add item', err);
            throw err;
        }
    }
    /**
     * Update an item
     */
    static async update(itemId, itemToUpdate) {
        try {
            if (itemToUpdate.searchTerm) {
                itemToUpdate.searchTerm = this.normalizeSearchTerm(itemToUpdate.searchTerm);
            }
            const item = await item_model_1.ItemModel.findByIdAndUpdate(itemId, itemToUpdate, {
                new: true,
            });
            return item;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to update item ${itemId}`, err);
            throw err;
        }
    }
    /**
     * Remove an item
     */
    static async remove(itemId) {
        try {
            await item_model_1.ItemModel.findByIdAndDelete(itemId);
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to remove item ${itemId}`, err);
            throw err;
        }
    }
    /**
     * Remove all items for a search term (clear cache)
     */
    static async clearCacheForSearchTerm(searchTerm) {
        try {
            const normalizedTerm = this.normalizeSearchTerm(searchTerm);
            await item_model_1.ItemModel.deleteMany({ searchTerm: normalizedTerm });
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to clear cache for search term ${searchTerm}`, err);
            throw err;
        }
    }
    /**
     * Get all unique search terms (for cache management)
     */
    static async getCachedSearchTerms() {
        try {
            const searchTerms = await item_model_1.ItemModel.distinct('searchTerm');
            return searchTerms;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get cached search terms', err);
            throw err;
        }
    }
    static async getBySearchIdBulk(searchIds) {
        try {
            const items = await item_model_1.ItemModel.find({ searchId: { $in: searchIds } });
            return items;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get items by searchId bulk', err);
            throw err;
        }
    }
    static async getImageNative(searchId) {
        try {
            const item = await item_model_1.ItemModel.findOne({ searchId });
            return item?.image || null;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get image native for searchId ${searchId}`, err);
            throw err;
        }
    }
}
exports.ItemService = ItemService;
