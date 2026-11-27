import { ItemModel, IItem } from './item.model'
import { logger } from '../../services/logger.service'
import { Item } from '@/types/Item/Item'
import { MealService } from '../meal/meal.service'
import { readableUserIds } from '../../services/user-access.service'
import { ItemName, LocalizedName } from '@/types/Item/LocalizedName'
import {
  categoryIdForLabel,
  isItemCategoryId,
  normalizeCategories,
  normalizeFoodQuery,
  relatedFoodSearch,
} from './item-categories'
import {
  getSearchVariants,
  relatedTermsPattern,
  searchTermPattern,
} from './item-search'

export type ItemSearchMatch = 'direct' | 'similar'

export class ItemService {
  /**
   * An item with a `createdBy` is private to that user; items without one
   * (the shared catalog / cached search results) stay public.
   */
  private static getVisibilityFilter(userId?: string) {
    if (!userId) return { createdBy: null }
    return { $or: [{ createdBy: null }, { createdBy: userId }] }
  }

  private static withVisibility(
    query: Record<string, unknown>,
    userId?: string
  ) {
    return { $and: [query, this.getVisibilityFilter(userId)] }
  }

  static async create(
    item: Partial<IItem> & { createdBy: string }
  ): Promise<IItem> {
    try {
      const newItem = await ItemModel.create(item)
      return newItem
    } catch (err) {
      logger.error('Failed to create item', err)
      throw err
    }
  }
  /**
   * Normalizes a search term for consistent caching
   */

  private static normalizeSearchTerm(term: string): string {
    return normalizeFoodQuery(term)
  }

  private static termRegex(pattern: string) {
    return { $regex: pattern, $options: 'i' as const }
  }

  private static nameMatchClauses(pattern: string) {
    return [
      { 'name.eng': this.termRegex(pattern) },
      { 'name.he': this.termRegex(pattern) },
      { 'name.default': this.termRegex(pattern) },
      { name: this.termRegex(pattern) },
      { searchTerms: this.termRegex(pattern) },
      { searchTerm: this.termRegex(pattern) },
    ]
  }

  private static escapeRegex(term: string): string {
    return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private static hasHebrew(value: string) {
    return /[\u0590-\u05FF]/.test(value)
  }

  private static hasLatin(value: string) {
    return /[a-zA-Z]/.test(value)
  }

  private static toLocalizedName(name: unknown): LocalizedName {
    if (name && typeof name === 'object') {
      const localized = name as LocalizedName
      return {
        eng: localized.eng || '',
        he: localized.he || '',
        default: localized.default || localized.eng || localized.he || '',
      }
    }

    const raw = String(name || '').trim()
    if (!raw) return { eng: '', he: '', default: '' }
    if (this.hasHebrew(raw) && !this.hasLatin(raw)) {
      return { eng: '', he: raw, default: raw }
    }
    if (this.hasLatin(raw) && !this.hasHebrew(raw)) {
      return { eng: raw, he: '', default: raw }
    }
    return { eng: raw, he: raw, default: raw }
  }

  private static getNameStrings(item: { name?: ItemName }): string[] {
    const name = item.name
    if (!name) return []
    if (typeof name === 'string') return [name]
    return [name.eng, name.he, name.default].filter(Boolean)
  }

  /**
   * Get cached items by search term
   */
  static async getBySearchTerm(
    searchTerm: string,
    userId?: string
  ): Promise<Array<IItem & { matchType: ItemSearchMatch }>> {
    try {
      const normalizedTerm = this.normalizeSearchTerm(searchTerm)
      if (!normalizedTerm) return []

      const variants = getSearchVariants(normalizedTerm)
      const pattern = variants.map((term) => this.escapeRegex(term)).join('|')
      if (!pattern) return []

      const nameClauses = [
        { 'name.eng': this.termRegex(pattern) },
        { 'name.he': this.termRegex(pattern) },
        { 'name.default': this.termRegex(pattern) },
        { name: this.termRegex(pattern) },
      ]
      const byPopularity = { popularity: -1 as const, _id: 1 as const }
      const [named, broad] = await Promise.all([
        ItemModel.find(this.withVisibility({ $or: nameClauses }, userId))
          .sort(byPopularity)
          .limit(40)
          .lean(),
        ItemModel.find(
          this.withVisibility({ $or: this.nameMatchClauses(pattern) }, userId)
        )
          .sort(byPopularity)
          .limit(40)
          .lean(),
      ])
      const seen = new Set<string>()
      const items = [...named, ...broad].filter((item) => {
        const id = String(item._id)
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })

      const meals = userId
        ? ((await MealService.query({
            name: this.termRegex(pattern),
            createdBy: { $in: await readableUserIds(userId) },
          })) as unknown as IItem[])
        : []

      const ranked = this.rankSearchResults(items as IItem[], variants).slice(0, 40)
      const direct = [
        ...ranked.map((item) => this.asSearchHit(item, 'direct')),
        ...meals.map((item) => this.asSearchHit(item, 'direct')),
      ]
      if (!direct.length || categoryIdForLabel(normalizedTerm)) return direct

      const related = relatedFoodSearch(variants)
      if (!related.categories.length) return direct

      const excludeIds = direct
        .map((item) => item._id)
        .filter((id) => id != null)
        .map((id) => String(id))
      const similar = await this.findSimilarItems(related, excludeIds, userId)
      return [
        ...direct,
        ...similar.map((item) => this.asSearchHit(item, 'similar')),
      ] as Array<IItem & { matchType: ItemSearchMatch }>
    } catch (err) {
      logger.error(`Failed to get items by search term ${searchTerm}`, err)
      throw err
    }
  }

  private static asSearchHit<T extends object>(
    item: T,
    matchType: ItemSearchMatch
  ) {
    const source =
      typeof (item as { toObject?: () => T }).toObject === 'function'
        ? (item as { toObject: () => T }).toObject()
        : item
    return { ...source, matchType }
  }

  private static async findSimilarItems(
    related: ReturnType<typeof relatedFoodSearch>,
    excludeIds: unknown[],
    userId?: string
  ) {
    const limit = 8
    const sort = { isCurated: -1 as const, popularity: -1 as const, _id: 1 as const }
    const excluded = new Set(excludeIds.map((id) => String(id)))
    const query: Record<string, unknown> = {
      categories: { $in: related.categories },
    }
    if (excluded.size) query._id = { $nin: [...excluded] }

    const pattern = related.terms.length
      ? relatedTermsPattern(related.terms)
      : ''
    if (pattern) query.$or = this.nameMatchClauses(pattern)

    const items = await ItemModel.find(this.withVisibility(query, userId))
      .sort(sort)
      .limit(limit + excluded.size)
      .lean()

    return items
      .filter((item) => !excluded.has(String(item._id)))
      .slice(0, limit)
  }

  private static matchRank(
    values: string[],
    variants: string[],
    variantSet: Set<string>
  ) {
    if (values.some((value) => variantSet.has(value))) return 100
    if (values.some((value) => variants.some((variant) => value.startsWith(variant))))
      return 80
    if (values.some((value) => variants.some((variant) => value.includes(variant))))
      return 50
    return 0
  }

  private static rankSearchResults(items: IItem[], variants: string[]) {
    const variantSet = new Set(variants)

    const rank = (item: IItem) => {
      const names = this.getNameStrings(item).map((name) =>
        this.normalizeSearchTerm(name)
      )
      const terms = [item.searchTerm, ...(item.searchTerms || [])]
        .filter((term): term is string => Boolean(term))
        .map((term) => this.normalizeSearchTerm(term))
      const nameRank = this.matchRank(names, variants, variantSet)
      if (nameRank) return nameRank
      const termRank = this.matchRank(terms, variants, variantSet)
      if (termRank) return termRank - 10
      return 10
    }

    return [...items].sort((a, b) => {
      const rankDiff = rank(b) - rank(a)
      if (rankDiff !== 0) return rankDiff
      return (b.popularity || 0) - (a.popularity || 0)
    })
  }

  /**
   * Check if a search term has cached results
   */
  static async hasCachedResults(
    searchTerm: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const items = await this.getBySearchTerm(searchTerm, userId)
      return items.length > 0
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
      const itemsToSave = newItems.map((item) => {
        const { _id, ...rest } = item as Item & { _id?: string }
        void _id
        return {
          ...rest,
          name: this.toLocalizedName(item.name),
          searchTerm: normalizedTerm,
          popularity: item.popularity ?? 8,
          isCurated: false,
          categories: normalizeCategories(item.categories),
        }
      })

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
  static async query(filterBy = {}, userId?: string): Promise<IItem[]> {
    try {
      const items = await ItemModel.find(this.withVisibility(filterBy, userId))
      return items
    } catch (err) {
      logger.error('Failed to query items', err)
      throw err
    }
  }

  /**
   * Search items by name (text search)
   */
  static async searchByName(query: string, userId?: string): Promise<IItem[]> {
    try {
      const items = await ItemModel.find(
        this.withVisibility({ $text: { $search: query } }, userId)
      )
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
      } else {
        const names = this.getNameStrings(item)
        item.searchTerm = this.normalizeSearchTerm(names[0] || '')
      }
      item.name = this.toLocalizedName(item.name)
      if (item.popularity == null) item.popularity = 8
      item.categories = normalizeCategories(item.categories)
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
      if (itemToUpdate.name !== undefined) {
        itemToUpdate.name = this.toLocalizedName(itemToUpdate.name)
      }
      if (itemToUpdate.categories !== undefined) {
        itemToUpdate.categories = normalizeCategories(itemToUpdate.categories)
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

  static async getImageNative(searchId: string): Promise<string | null> {
    try {
      const item = await ItemModel.findOne({ searchId })
      return item?.image || null
    } catch (err) {
      logger.error(`Failed to get image native for searchId ${searchId}`, err)
      throw err
    }
  }

  static async bumpPopularity(searchId: string): Promise<IItem | null> {
    try {
      if (!searchId) return null
      const item = await ItemModel.findOneAndUpdate(
        { searchId },
        { $inc: { popularity: 1 } },
        { new: true }
      )
      return item
    } catch (err) {
      logger.error(`Failed to bump popularity for ${searchId}`, err)
      throw err
    }
  }

  static async listForPlayground(filter: {
    q?: string
    type?: string
    category?: string
    page?: number
    limit?: number
  }) {
    const page = Math.max(0, Number(filter.page) || 0)
    const limit = Math.min(200, Math.max(1, Number(filter.limit) || 80))
    const query: Record<string, unknown> = {}

    if (filter.type && filter.type !== 'all') {
      query.type = filter.type
    }

    if (filter.category && isItemCategoryId(filter.category)) {
      query.categories = filter.category
    }

    if (filter.q) {
      const pattern = searchTermPattern(filter.q)
      if (pattern) {
        query.$or = [
          ...this.nameMatchClauses(pattern),
          {
            searchId: this.termRegex(
              this.escapeRegex(this.normalizeSearchTerm(filter.q))
            ),
          },
        ]
      }
    }

    const [items, total] = await Promise.all([
      ItemModel.find(query)
        .sort({ popularity: -1, _id: 1 })
        .skip(page * limit)
        .limit(limit)
        .lean(),
      ItemModel.countDocuments(query),
    ])

    return { items, total, page, limit }
  }

  static async applyCatalog(items: Item[]) {
    try {
      await ItemModel.collection.dropIndex('name_text')
    } catch {
      // index may not exist
    }

    const foods = items.filter((item) => item.type === 'food')
    const products = items.filter((item) => item.type === 'product')

    await ItemModel.deleteMany({ type: 'food' })

    if (foods.length) {
      await ItemModel.insertMany(
        foods.map((item) => {
          const { _id, ...rest } = item as Item & { _id?: string }
          void _id
          return {
            ...rest,
            name: this.toLocalizedName(rest.name),
            isCurated: true,
            popularity: rest.popularity ?? 50,
            categories: normalizeCategories(rest.categories),
          }
        })
      )
    }

    for (const product of products) {
      const { _id, ...rest } = product as Item & { _id?: string }
      void _id
      if (!rest.searchId) continue
      await ItemModel.updateOne(
        { searchId: rest.searchId },
        {
          $set: {
            ...rest,
            name: this.toLocalizedName(rest.name),
            type: 'product',
            isCurated: false,
            popularity: rest.popularity ?? 14,
            categories: normalizeCategories(rest.categories),
          },
        },
        { upsert: true }
      )
    }

    return {
      foods: foods.length,
      products: products.length,
    }
  }

  static getCategorySort(sortBy?: string): Record<string, 1 | -1> {
    if (sortBy === 'calories (high to low)')
      return { 'macros.calories': -1, _id: 1 }
    if (sortBy === 'calories (low to high)')
      return { 'macros.calories': 1, _id: 1 }
    if (sortBy === 'protein (high to low)')
      return { 'macros.protein': -1, _id: 1 }
    if (sortBy === 'protein (low to high)')
      return { 'macros.protein': 1, _id: 1 }
    if (sortBy === 'carbs (high to low)') return { 'macros.carbs': -1, _id: 1 }
    if (sortBy === 'carbs (low to high)') return { 'macros.carbs': 1, _id: 1 }
    if (sortBy === 'fat (high to low)') return { 'macros.fat': -1, _id: 1 }
    if (sortBy === 'fat (low to high)') return { 'macros.fat': 1, _id: 1 }
    return { popularity: -1, _id: 1 }
  }

  static async listByCategory(
    filter: {
      category: string
      txt?: string
      sortBy?: string
      skip?: number
      limit?: number
    },
    userId?: string
  ) {
    if (!isItemCategoryId(filter.category)) {
      return { items: [], nextSkip: undefined as number | undefined, total: 0 }
    }

    const skip = Math.max(0, Number(filter.skip) || 0)
    const limit = Math.min(80, Math.max(1, Number(filter.limit) || 20))
    const query: Record<string, unknown> = { categories: filter.category }

    if (filter.txt) {
      const pattern = searchTermPattern(filter.txt)
      if (pattern) query.$or = this.nameMatchClauses(pattern)
    }

    const visibleQuery = this.withVisibility(query, userId)

    const [items, total] = await Promise.all([
      ItemModel.find(visibleQuery)
        .sort(this.getCategorySort(filter.sortBy))
        .skip(skip)
        .limit(limit)
        .lean(),
      ItemModel.countDocuments(visibleQuery),
    ])

    const hasMore = skip + items.length < total
    return {
      items,
      total,
      nextSkip: hasMore ? skip + limit : undefined,
    }
  }

  static async getCategoryCounts(userId?: string) {
    const rows = await ItemModel.aggregate<{ _id: string; count: number }>([
      { $match: this.getVisibilityFilter(userId) },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
    ])

    const counts: Record<string, number> = {}
    for (const row of rows) {
      if (row._id) counts[row._id] = row.count
    }
    return counts
  }
}
