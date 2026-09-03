import { ItemModel, IItem } from './item.model'
import { logger } from '../../services/logger.service'
import { Item } from '@/types/Item/Item'
import { MealService } from '../meal/meal.service'
import { ItemName, LocalizedName } from '@/types/Item/LocalizedName'
import { isItemCategoryId } from './item-categories'

export class ItemService {
  /**
   * Normalizes a search term for consistent caching
   */


  private static normalizeSearchTerm(term: string): string {
    if (!term) return ''
  
    return term
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0591-\u05C7]/g, '') // Hebrew nikud
      .replace(/[\u0300-\u036f]/g, '') // general combining marks
      .replace(/[״׳'"]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
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
  static async getBySearchTerm(searchTerm: string): Promise<IItem[]> {
    try {
      const normalizedTerm = this.normalizeSearchTerm(searchTerm)
      if (!normalizedTerm) return []

      const allVariants = [
        ...new Set(
          [normalizedTerm, ...this.getSearchVariants(normalizedTerm)].map(
            (term) => this.normalizeSearchTerm(term)
          )
        ),
      ].filter(Boolean)

      const escapedVariants = allVariants.map((term) => this.escapeRegex(term))

      const items = await ItemModel.find({
        $or: escapedVariants.flatMap((term) => [
          { 'name.eng': { $regex: term, $options: 'i' } },
          { 'name.he': { $regex: term, $options: 'i' } },
          { 'name.default': { $regex: term, $options: 'i' } },
          { name: { $regex: term, $options: 'i' } },
          { searchTerms: { $regex: term, $options: 'i' } },
          { searchTerm: { $regex: term, $options: 'i' } },
        ]),
      })
        .sort({ popularity: -1, _id: 1 })
        .limit(40)
        .lean()

      const meals = (await MealService.query({
        name: {
          $regex: this.escapeRegex(normalizedTerm),
          $options: 'i',
        },
      })) as unknown as IItem[]

      const ranked = this.rankSearchResults(items as IItem[], allVariants)
      return [...ranked, ...meals]
    } catch (err) {
      logger.error(`Failed to get items by search term ${searchTerm}`, err)
      throw err
    }
  }

  private static rankSearchResults(items: IItem[], variants: string[]) {
    const variantSet = new Set(variants)

    const rank = (item: IItem) => {
      const names = this.getNameStrings(item).map((name) =>
        this.normalizeSearchTerm(name)
      )
      const terms = (item.searchTerms || []).map((term) =>
        this.normalizeSearchTerm(term)
      )
      const haystack = [...names, ...terms]

      if (haystack.some((value) => variantSet.has(value))) return 100
      if (haystack.some((value) => variants.some((v) => value.startsWith(v))))
        return 80
      if (haystack.some((value) => variants.some((v) => value.includes(v))))
        return 50
      return 10
    }

    return [...items].sort((a, b) => {
      const rankDiff = rank(b) - rank(a)
      if (rankDiff !== 0) return rankDiff
      return (b.popularity || 0) - (a.popularity || 0)
    })
  }

  private static getSearchVariants(term: string): string[] {
    const normalized = this.normalizeSearchTerm(term).toLowerCase().trim()
  
    const variants = new Set<string>()
    variants.add(normalized)
  
    const words = normalized.split(/\s+/)
    const lastWord = words[words.length - 1]
  
    if (!lastWord) return [...variants]
  
    // eggs -> egg
    if (lastWord.endsWith('s') && lastWord.length > 3) {
      variants.add([...words.slice(0, -1), lastWord.slice(0, -1)].join(' '))
    }
  
    // egg -> eggs
    if (!lastWord.endsWith('s')) {
      variants.add([...words.slice(0, -1), `${lastWord}s`].join(' '))
    }
  
    // tomatoes -> tomato
    if (lastWord.endsWith('es') && lastWord.length > 4) {
      variants.add([...words.slice(0, -1), lastWord.slice(0, -2)].join(' '))
    }
  
    // berry -> berries
    if (lastWord.endsWith('y') && lastWord.length > 3) {
      variants.add([...words.slice(0, -1), `${lastWord.slice(0, -1)}ies`].join(' '))
    }
  
    // berries -> berry
    if (lastWord.endsWith('ies') && lastWord.length > 4) {
      variants.add([...words.slice(0, -1), `${lastWord.slice(0, -3)}y`].join(' '))
    }
  
    return [...variants].filter(Boolean)
  }

  /**
   * Check if a search term has cached results
   */
  static async hasCachedResults(searchTerm: string): Promise<boolean> {
    try {
      const items = await this.getBySearchTerm(searchTerm)
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
          categories: Array.isArray(item.categories) ? item.categories : [],
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
      } else {
        const names = this.getNameStrings(item)
        item.searchTerm = this.normalizeSearchTerm(names[0] || '')
      }
      item.name = this.toLocalizedName(item.name)
      if (item.popularity == null) item.popularity = 8
      if (!Array.isArray(item.categories)) item.categories = []
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
      const term = this.escapeRegex(this.normalizeSearchTerm(filter.q))
      query.$or = [
        { 'name.eng': { $regex: term, $options: 'i' } },
        { 'name.he': { $regex: term, $options: 'i' } },
        { 'name.default': { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } },
        { searchTerms: { $regex: term, $options: 'i' } },
        { searchId: { $regex: term, $options: 'i' } },
      ]
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
      // index may not exist after the first migration
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
            categories: Array.isArray(rest.categories) ? rest.categories : [],
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
            categories: Array.isArray(rest.categories) ? rest.categories : [],
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

  static async listByCategory(filter: {
    category: string
    txt?: string
    sortBy?: string
    skip?: number
    limit?: number
  }) {
    if (!isItemCategoryId(filter.category)) {
      return { items: [], nextSkip: undefined as number | undefined, total: 0 }
    }

    const skip = Math.max(0, Number(filter.skip) || 0)
    const limit = Math.min(80, Math.max(1, Number(filter.limit) || 20))
    const query: Record<string, unknown> = { categories: filter.category }

    if (filter.txt) {
      const term = this.escapeRegex(this.normalizeSearchTerm(filter.txt))
      query.$or = [
        { 'name.eng': { $regex: term, $options: 'i' } },
        { 'name.he': { $regex: term, $options: 'i' } },
        { 'name.default': { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } },
        { searchTerms: { $regex: term, $options: 'i' } },
      ]
    }

    const [items, total] = await Promise.all([
      ItemModel.find(query)
        .sort(this.getCategorySort(filter.sortBy))
        .skip(skip)
        .limit(limit)
        .lean(),
      ItemModel.countDocuments(query),
    ])

    const hasMore = skip + items.length < total
    return {
      items,
      total,
      nextSkip: hasMore ? skip + limit : undefined,
    }
  }

  static async getCategoryCounts() {
    const rows = await ItemModel.aggregate<{ _id: string; count: number }>([
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
