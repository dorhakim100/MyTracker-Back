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
        if (!term)
            return '';
        return term
            .toLowerCase()
            .normalize('NFKD')
            .replace(/[\u0591-\u05C7]/g, '') // Hebrew nikud
            .replace(/[\u0300-\u036f]/g, '') // general combining marks
            .replace(/[״׳'"]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    static escapeRegex(term) {
        return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Get cached items by search term
     */
    static async getBySearchTerm(searchTerm) {
        try {
            const normalizedTerm = this.normalizeSearchTerm(searchTerm);
            const translateSign = (0, utils_1.isEnglishWord)(normalizedTerm) ? 'he' : 'en';
            const translatedTerm = await translate_service_1.TranslateService.translate(normalizedTerm, translateSign);
            const normalizedTranslatedTerm = this.normalizeSearchTerm(translatedTerm);
            logger_service_1.logger.info(`searchTerm: ${searchTerm}`);
            logger_service_1.logger.info(`normalizedTerm: ${normalizedTerm}`);
            logger_service_1.logger.info(`normalizedTranslatedTerm: ${normalizedTranslatedTerm}`);
            const searchVariants = this.getSearchVariants(normalizedTerm);
            const translatedVariants = this.getSearchVariants(normalizedTranslatedTerm);
            const allVariants = [
                ...new Set([
                    normalizedTerm,
                    normalizedTranslatedTerm,
                    ...searchVariants,
                    ...translatedVariants,
                ].map(term => this.normalizeSearchTerm(term))),
            ].filter(Boolean);
            const escapedVariants = allVariants.map(term => this.escapeRegex(term));
            const items = await item_model_1.ItemModel.aggregate([
                {
                    $match: {
                        $or: escapedVariants.flatMap(term => [
                            {
                                name: {
                                    $regex: term,
                                    $options: 'i',
                                },
                            },
                            {
                                searchTerms: {
                                    $elemMatch: {
                                        $regex: term,
                                        $options: 'i',
                                    },
                                },
                            },
                            // temporary fallback for old documents
                            {
                                searchTerm: {
                                    $regex: term,
                                    $options: 'i',
                                },
                            },
                        ]),
                    },
                },
                {
                    $addFields: {
                        _nameLower: {
                            $toLower: {
                                $ifNull: ['$name', ''],
                            },
                        },
                        _searchTermsLower: {
                            $map: {
                                input: {
                                    $ifNull: ['$searchTerms', []],
                                },
                                as: 'term',
                                in: {
                                    $toLower: '$$term',
                                },
                            },
                        },
                        _searchTermLower: {
                            $toLower: {
                                $ifNull: ['$searchTerm', ''],
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        searchRank: {
                            $switch: {
                                branches: [
                                    // exact match in new searchTerms
                                    {
                                        case: {
                                            $anyElementTrue: {
                                                $map: {
                                                    input: '$_searchTermsLower',
                                                    as: 'term',
                                                    in: {
                                                        $in: ['$$term', allVariants],
                                                    },
                                                },
                                            },
                                        },
                                        then: 100,
                                    },
                                    // exact match in old searchTerm fallback
                                    {
                                        case: {
                                            $in: ['$_searchTermLower', allVariants],
                                        },
                                        then: 95,
                                    },
                                    // exact name match
                                    {
                                        case: {
                                            $in: ['$_nameLower', allVariants],
                                        },
                                        then: 90,
                                    },
                                    // searchTerms starts with query
                                    {
                                        case: {
                                            $anyElementTrue: {
                                                $map: {
                                                    input: '$_searchTermsLower',
                                                    as: 'term',
                                                    in: {
                                                        $or: escapedVariants.map(term => ({
                                                            $regexMatch: {
                                                                input: '$$term',
                                                                regex: `^${term}`,
                                                                options: 'i',
                                                            },
                                                        })),
                                                    },
                                                },
                                            },
                                        },
                                        then: 80,
                                    },
                                    // old searchTerm starts with query
                                    {
                                        case: {
                                            $or: escapedVariants.map(term => ({
                                                $regexMatch: {
                                                    input: '$_searchTermLower',
                                                    regex: `^${term}`,
                                                    options: 'i',
                                                },
                                            })),
                                        },
                                        then: 75,
                                    },
                                    // name starts with query
                                    {
                                        case: {
                                            $or: escapedVariants.map(term => ({
                                                $regexMatch: {
                                                    input: '$_nameLower',
                                                    regex: `^${term}`,
                                                    options: 'i',
                                                },
                                            })),
                                        },
                                        then: 70,
                                    },
                                    // searchTerms contains query
                                    {
                                        case: {
                                            $anyElementTrue: {
                                                $map: {
                                                    input: '$_searchTermsLower',
                                                    as: 'term',
                                                    in: {
                                                        $or: escapedVariants.map(term => ({
                                                            $regexMatch: {
                                                                input: '$$term',
                                                                regex: term,
                                                                options: 'i',
                                                            },
                                                        })),
                                                    },
                                                },
                                            },
                                        },
                                        then: 60,
                                    },
                                    // old searchTerm contains query
                                    {
                                        case: {
                                            $or: escapedVariants.map(term => ({
                                                $regexMatch: {
                                                    input: '$_searchTermLower',
                                                    regex: term,
                                                    options: 'i',
                                                },
                                            })),
                                        },
                                        then: 55,
                                    },
                                    // name contains query
                                    {
                                        case: {
                                            $or: escapedVariants.map(term => ({
                                                $regexMatch: {
                                                    input: '$_nameLower',
                                                    regex: term,
                                                    options: 'i',
                                                },
                                            })),
                                        },
                                        then: 50,
                                    },
                                ],
                                default: 0,
                            },
                        },
                    },
                },
                {
                    $sort: {
                        searchRank: -1,
                        name: 1,
                        _id: 1,
                    },
                },
                {
                    $project: {
                        _nameLower: 0,
                        _searchTermsLower: 0,
                        _searchTermLower: 0,
                        searchRank: 0,
                    },
                },
            ]);
            const meals = (await meal_service_1.MealService.query({
                $or: escapedVariants.map(term => ({
                    name: {
                        $regex: term,
                        $options: 'i',
                    },
                })),
            }));
            return [...items, ...meals];
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get items by search term ${searchTerm}`, err);
            throw err;
        }
    }
    static getSearchVariants(term) {
        const normalized = this.normalizeSearchTerm(term).toLowerCase().trim();
        const variants = new Set();
        variants.add(normalized);
        const words = normalized.split(/\s+/);
        const lastWord = words[words.length - 1];
        if (!lastWord)
            return [...variants];
        // eggs -> egg
        if (lastWord.endsWith('s') && lastWord.length > 3) {
            variants.add([...words.slice(0, -1), lastWord.slice(0, -1)].join(' '));
        }
        // egg -> eggs
        if (!lastWord.endsWith('s')) {
            variants.add([...words.slice(0, -1), `${lastWord}s`].join(' '));
        }
        // tomatoes -> tomato
        if (lastWord.endsWith('es') && lastWord.length > 4) {
            variants.add([...words.slice(0, -1), lastWord.slice(0, -2)].join(' '));
        }
        // berry -> berries
        if (lastWord.endsWith('y') && lastWord.length > 3) {
            variants.add([...words.slice(0, -1), `${lastWord.slice(0, -1)}ies`].join(' '));
        }
        // berries -> berry
        if (lastWord.endsWith('ies') && lastWord.length > 4) {
            variants.add([...words.slice(0, -1), `${lastWord.slice(0, -3)}y`].join(' '));
        }
        return [...variants].filter(Boolean);
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
