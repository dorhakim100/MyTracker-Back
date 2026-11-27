export const ITEM_CATEGORY_IDS = [
  'proteins',
  'carbs',
  'dairy',
  'prepared',
  'fatsOils',
  'nutsSeeds',
  'fruits',
  'vegetables',
  'snacks',
  'sweets',
  'drinks',
  'sauces',
] as const

export type ItemCategoryId = (typeof ITEM_CATEGORY_IDS)[number]

export const ITEM_CATEGORY_LABELS: Record<
  ItemCategoryId,
  { eng: string; he: string; aliases: string[] }
> = {
  proteins: {
    eng: 'Proteins',
    he: 'חלבונים',
    aliases: ['protein', 'חלבון', 'חלבונים'],
  },
  carbs: {
    eng: 'Carbs',
    he: 'פחמימות',
    aliases: ['carb', 'carbohydrate', 'carbohydrates', 'פחמימה', 'פחמימות'],
  },
  vegetables: {
    eng: 'Vegetables',
    he: 'ירקות',
    aliases: ['vegetable', 'veggie', 'veggies', 'ירק', 'ירקות'],
  },
  fruits: {
    eng: 'Fruits',
    he: 'פירות',
    aliases: ['fruit', 'פרי', 'פירות'],
  },
  dairy: {
    eng: 'Dairy',
    he: 'חלב ומוצריו',
    aliases: ['dairy'],
  },
  nutsSeeds: {
    eng: 'Nuts & seeds',
    he: 'אגוזים וזרעים',
    aliases: ['nuts', 'seeds', 'אגוזים', 'זרעים'],
  },
  fatsOils: {
    eng: 'Fats & oils',
    he: 'שמנים ושומנים',
    aliases: ['fats', 'oils', 'שמנים', 'שומנים'],
  },
  prepared: {
    eng: 'Prepared dishes',
    he: 'מנות מוכנות',
    aliases: ['prepared', 'meals', 'dishes', 'מנות', 'מוכן'],
  },
  snacks: {
    eng: 'Snacks',
    he: 'חטיפים',
    aliases: ['snack', 'חטיף', 'חטיפים'],
  },
  drinks: {
    eng: 'Drinks',
    he: 'משקאות',
    aliases: ['drinks', 'beverages', 'beverage', 'drink', 'משקה', 'משקאות'],
  },
  sauces: {
    eng: 'Sauces',
    he: 'רטבים',
    aliases: [
      'sauces',
      'condiments',
      'condiment',
      'sauce',
      'רוטב',
      'רטבים',
      'תבלינים',
    ],
  },
  sweets: {
    eng: 'Sweets',
    he: 'מתוקים',
    aliases: ['sweet', 'dessert', 'candy', 'מתוק', 'מתוקים', 'קינוח'],
  },
}

type CategoryRule = { category: ItemCategoryId; keywords: string[] }

const CURATED_CATEGORIES: Record<string, ItemCategoryId[]> = {
  'chicken breast, raw': ['proteins'],
  'chicken breast, cooked': ['proteins'],
  'chicken thigh, raw': ['proteins'],
  'chicken thigh, cooked': ['proteins'],
  'chicken wing, cooked': ['proteins'],
  'ground turkey, raw': ['proteins'],
  'turkey breast, cooked': ['proteins'],
  'ground beef 90% lean, raw': ['proteins'],
  'ground beef 90% lean, cooked': ['proteins'],
  'ground beef 80% lean, raw': ['proteins'],
  'beef steak, cooked': ['proteins'],
  'salmon, cooked': ['proteins'],
  'pork tenderloin, cooked': ['proteins'],
  'salmon, raw': ['proteins'],
  'tuna, canned in oil': ['proteins'],
  'tuna, canned in water': ['proteins'],
  'cod, cooked': ['proteins'],
  'shrimp, cooked': ['proteins'],
  'tilapia, cooked': ['proteins'],
  'egg white': ['proteins'],
  'sardines, canned in oil': ['proteins'],
  'egg, whole': ['proteins'],
  'egg yolk': ['proteins'],
  'egg, hard-boiled': ['proteins'],
  'scrambled eggs': ['proteins'],
  'lentils, cooked': ['proteins'],
  tempeh: ['proteins'],
  'tofu, firm': ['proteins'],
  'kidney beans, cooked': ['proteins'],
  'chickpeas, cooked': ['proteins'],
  'black beans, cooked': ['proteins'],
  'edamame, cooked': ['proteins'],
  'milk, whole (3%)': ['dairy', 'drinks'],
  'milk, skim': ['dairy', 'drinks'],
  'greek yogurt, plain, lowfat': ['dairy', 'proteins'],
  'milk, 1%': ['dairy', 'drinks'],
  'greek yogurt, plain, nonfat': ['dairy', 'proteins'],
  'cheddar cheese': ['dairy', 'proteins'],
  'cottage cheese, full fat': ['dairy', 'proteins'],
  'cottage cheese, 2%': ['dairy', 'proteins'],
  'mozzarella, part skim': ['dairy', 'proteins'],
  'feta cheese': ['dairy', 'proteins'],
  'parmesan cheese': ['dairy', 'proteins'],
  'heavy cream': ['dairy', 'fatsOils'],
  butter: ['dairy', 'fatsOils'],
  'sour cream': ['dairy', 'fatsOils'],
  'whey protein powder': ['proteins'],
  'almond milk, unsweetened': ['dairy', 'drinks'],
  'oat milk, unsweetened': ['dairy', 'drinks'],
  'soy milk, unsweetened': ['dairy', 'drinks'],
  'white rice, cooked': ['carbs'],
  'couscous, cooked': ['carbs'],
  'pasta, dry': ['carbs'],
  'oatmeal, cooked': ['carbs'],
  'white rice, dry': ['carbs'],
  'brown rice, cooked': ['carbs'],
  'whole wheat pasta, cooked': ['carbs'],
  'pasta, cooked': ['carbs'],
  'oats, dry': ['carbs'],
  'quinoa, cooked': ['carbs'],
  'whole wheat bread': ['carbs'],
  'white bread': ['carbs'],
  'flour tortilla': ['carbs'],
  bagel: ['carbs'],
  'pita bread': ['carbs'],
  'potato, baked': ['carbs', 'vegetables'],
  'potato, boiled': ['carbs', 'vegetables'],
  'spinach, raw': ['vegetables'],
  'cauliflower, raw': ['vegetables'],
  'french fries': ['snacks', 'carbs'],
  'sweet potato, baked': ['carbs', 'vegetables'],
  'broccoli, raw': ['vegetables'],
  lettuce: ['vegetables'],
  'kale, raw': ['vegetables'],
  cucumber: ['vegetables'],
  garlic: ['vegetables'],
  'bell pepper': ['vegetables'],
  onion: ['vegetables'],
  carrot: ['vegetables'],
  tomato: ['vegetables'],
  mushrooms: ['vegetables'],
  zucchini: ['vegetables'],
  eggplant: ['vegetables'],
  'green beans': ['vegetables'],
  asparagus: ['vegetables'],
  'green peas': ['vegetables'],
  apple: ['fruits'],
  cabbage: ['vegetables'],
  banana: ['fruits'],
  corn: ['vegetables'],
  avocado: ['fruits', 'fatsOils'],
  orange: ['fruits'],
  strawberries: ['fruits'],
  blueberries: ['fruits'],
  mango: ['fruits'],
  pineapple: ['fruits'],
  cantaloupe: ['fruits'],
  kiwi: ['fruits'],
  watermelon: ['fruits'],
  grapes: ['fruits'],
  peach: ['fruits'],
  pear: ['fruits'],
  dates: ['fruits'],
  raisins: ['fruits'],
  almonds: ['nutsSeeds'],
  walnuts: ['nutsSeeds'],
  'peanut butter': ['nutsSeeds', 'fatsOils'],
  cashews: ['nutsSeeds'],
  peanuts: ['nutsSeeds'],
  tahini: ['nutsSeeds', 'sauces', 'fatsOils'],
  'chia seeds': ['nutsSeeds'],
  pistachios: ['nutsSeeds'],
  hummus: ['prepared', 'proteins'],
  'olive oil': ['fatsOils'],
  'coconut oil': ['fatsOils'],
  'avocado oil': ['fatsOils'],
  'canola oil': ['fatsOils'],
  honey: ['sauces', 'sweets'],
  mayonnaise: ['sauces', 'fatsOils'],
  ketchup: ['sauces'],
  'soy sauce': ['sauces'],
  'coffee, black': ['drinks'],
  water: ['drinks'],
  'orange juice': ['drinks', 'fruits'],
  'green tea': ['drinks'],
  falafel: ['prepared', 'proteins'],
  'chicken schnitzel': ['prepared', 'proteins'],
  labneh: ['dairy', 'proteins'],
}

const RULES: CategoryRule[] = [
  {
    category: 'sweets',
    keywords: [
      'ice cream',
      'chocolate',
      'chocolat',
      'pudding',
      'cookie',
      'cookies',
      'cake',
      'brownie',
      'candy',
      'gummy',
      'waffle',
      'donut',
      'doughnut',
      'pastry',
      'muffin',
      'macaron',
      'popsicle',
      'sorbet',
      'gelato',
      'dessert',
      'שוקולד',
      'עוגיה',
      'עוגיות',
      'עוגה',
      'גלידה',
      'פודינג',
      'רוגעלך',
      'וופל',
      'סוכריה',
      'קינוח',
      'ממתק',
      'ביסקוויט',
      'פתיבר',
    ],
  },
  {
    category: 'snacks',
    keywords: [
      'protein bar',
      'granola bar',
      'energy bar',
      'chips',
      'crisps',
      'popcorn',
      'pretzel',
      'cracker',
      'trail mix',
      'rice cake',
      'snack',
      'חטיף',
      'חטיפים',
      'ציפס',
      'צ׳יפס',
      "צ'יפס",
      'פופקורן',
      'קרקר',
      'בייגלה',
      'נישנוש',
    ],
  },
  {
    category: 'prepared',
    keywords: [
      'pancake',
      'nuggets',
      'ramen',
      'dim sum',
      'falafel',
      'schnitzel',
      'shnitzel',
      'shawarma',
      'pizza',
      'burger',
      'sandwich',
      'burrito',
      'taco',
      'sushi',
      'soup',
      'salad',
      'lasagna',
      'kebab',
      'bourekas',
      'borekas',
      'omelet',
      'omelette',
      'shakshuka',
      'curry',
      'stir fry',
      'lunchbox',
      'lunch to go',
      'patty',
      'patties',
      'sausage',
      'hot dog',
      'ravioli',
      'tortellini',
      'פלאפל',
      'שניצל',
      'שווארמה',
      'פיצה',
      'המבורגר',
      'קבב',
      'בורקס',
      'שקשוקה',
      'מרק',
      'סלט',
      'כריך',
      'סנדוויץ',
      'קציצות',
      'נאגטס',
      'פנקייק',
      'ראמן',
    ],
  },
  {
    category: 'proteins',
    keywords: [
      'chicken',
      'turkey',
      'beef',
      'cornbeef',
      'corned beef',
      'pastrami',
      'entrecote',
      'asado',
      'herring',
      'gefilte',
      'anchovy',
      'pangasius',
      'fish',
      'steak',
      'pork',
      'lamb',
      'veal',
      'salmon',
      'tuna',
      'cod',
      'tilapia',
      'shrimp',
      'prawn',
      'sardine',
      'mackerel',
      'trout',
      'sea bass',
      'egg white',
      'egg yolk',
      'scrambled egg',
      'hard-boiled',
      'whey',
      'protein powder',
      'protein isolate',
      'tofu',
      'tempeh',
      'seitan',
      'lentil',
      'chickpea',
      'edamame',
      'black bean',
      'kidney bean',
      'hummus',
      'schnitzel',
      'falafel',
      'עוף',
      'הודו',
      'בקר',
      'סטייק',
      'כבש',
      'חזיר',
      'סלמון',
      'טונה',
      'שרימפס',
      'ביצה',
      'ביצים',
      'חלמון',
      'טופו',
      'טמפה',
      'סייטן',
      'עדשים',
      'חומוס',
      'אדממה',
      'שעועית',
      'אבקת חלבון',
      'חלבון',
      'דג',
      'אמנון',
      'אנטריקוט',
      'אסאדו',
      'בשר',
      'פסטרמה',
      'לברק',
      'אנשובי',
    ],
  },
  {
    category: 'dairy',
    keywords: [
      'yogurt',
      'yoghurt',
      'yogort',
      'yoplait',
      'danone',
      'cottage',
      'mozzarella',
      'cheddar',
      'feta',
      'parmesan',
      'gouda',
      'labneh',
      'cream cheese',
      'sour cream',
      'heavy cream',
      'butter',
      'cheese',
      'ghee',
      'lassi',
      'skyr',
      'יוגורט',
      'קוטג',
      'גבינה',
      'מוצרלה',
      'פטה',
      'פרמזן',
      'לבנה',
      'גאודה',
      'חמאה',
      'שמנת',
      'חלב',
    ],
  },
  {
    category: 'nutsSeeds',
    keywords: [
      'almond',
      'walnut',
      'cashew',
      'pistachio',
      'peanut',
      'hazelnut',
      'pecan',
      'macadamia',
      'chia',
      'flax',
      'pumpkin seed',
      'sunflower seed',
      'sesame',
      'tahini',
      'peanut butter',
      'שקדים',
      'אגוז',
      'קשיו',
      'פיסטוק',
      'בוטנים',
      'טחינה',
      'שומשום',
      'חמאת בוטנים',
      'גרעינים',
    ],
  },
  {
    category: 'fatsOils',
    keywords: [
      'olive oil',
      'coconut oil',
      'avocado oil',
      'canola oil',
      'sunflower oil',
      'vegetable oil',
      'sesame oil',
      'fish oil',
      'coconut cream',
      'mayonnaise',
      'peanut butter',
      'שמן זית',
      'שמן קוקוס',
      'שמן אבוקדו',
      'שמן קנולה',
      'שמן חמניות',
      'מיונז',
    ],
  },
  {
    category: 'sauces',
    keywords: [
      'ketchup',
      'mustard',
      'mayonnaise',
      'soy sauce',
      'hot sauce',
      'barbecue',
      'bbq',
      'vinaigrette',
      'dressing',
      'tahini',
      'pickle',
      'pickles',
      'honey',
      'maple',
      'puree',
      'sauce',
      'sause',
      'silan',
      'קטשופ',
      'חרדל',
      'מיונז',
      'רוטב',
      'דבש',
      'סילאן',
      'מייפל',
    ],
  },
  {
    category: 'drinks',
    keywords: [
      'coffee',
      'espresso',
      'latte',
      'tea',
      'juice',
      'smoothie',
      'shake',
      'soda',
      'cola',
      'water',
      'drink',
      'nectar',
      'oat drink',
      'almond milk',
      'soy milk',
      'oat milk',
      'קפה',
      'תה',
      'מיץ',
      'שייק',
      'מים',
      'משקה',
      'נס קפה',
    ],
  },
  {
    category: 'fruits',
    keywords: [
      'strawberry',
      'blueberry',
      'raspberry',
      'pineapple',
      'watermelon',
      'cantaloupe',
      'banana',
      'mango',
      'orange',
      'apple',
      'grape',
      'peach',
      'pear',
      'kiwi',
      'date',
      'raisin',
      'avocado',
      'cherry',
      'plum',
      'lemon',
      'lime',
      'berry',
      'berries',
      'תפוח',
      'בננה',
      'תפוז',
      'תות',
      'ענבים',
      'אבטיח',
      'מלון',
      'אננס',
      'מנגו',
      'קיווי',
      'אפרסק',
      'אגס',
      'תמר',
      'צימוק',
      'אבוקדו',
      'אוכמניות',
    ],
  },
  {
    category: 'vegetables',
    keywords: [
      'broccoli',
      'spinach',
      'cauliflower',
      'lettuce',
      'kale',
      'cucumber',
      'zucchini',
      'eggplant',
      'asparagus',
      'mushroom',
      'cabbage',
      'carrot',
      'tomato',
      'onion',
      'garlic',
      'pepper',
      'celery',
      'beet',
      'corn',
      'pea',
      'peas',
      'green bean',
      'sweet potato',
      'ברוקולי',
      'תרד',
      'כרובית',
      'חסה',
      'מלפפון',
      'קישוא',
      'חציל',
      'פטריות',
      'כרוב',
      'גזר',
      'עגבני',
      'בצל',
      'שום',
      'פלפל',
      'תירס',
      'אפונה',
      'בטטה',
      'שעועית ירוקה',
    ],
  },
  {
    category: 'carbs',
    keywords: [
      'oatmeal',
      'pancake',
      'buckwheat',
      'toast',
      'baguette',
      'phyllo',
      'spaghetti',
      'noodles',
      'pasta',
      'rice',
      'quinoa',
      'couscous',
      'bread',
      'bagel',
      'pita',
      'bun',
      'roll',
      'tortilla',
      'wrap',
      'oats',
      'potato',
      'fries',
      'bulgur',
      'barley',
      'flour',
      'אורז',
      'פסטה',
      'ספגטי',
      'נודלס',
      'לחם',
      'פיתה',
      'בייגל',
      'טורטיה',
      'קינואה',
      'קוסקוס',
      'שיבולת',
      'קוואקר',
      'תפוח אדמה',
      'בטטה',
      'פתיתים',
      'כוסמת',
      'טוסט',
      'לחמניה',
      'בגט',
      'פילו',
      'פירה',
      'פריכיות',
    ],
  },
]

// Sibling foods inside a broad category. Searching a bun should surface other
// breads, not every carb.
const FOOD_FAMILIES: string[][] = [
  [
    'bread',
    'bagel',
    'pita',
    'bun',
    'baguette',
    'toast',
    'tortilla',
    'wrap',
    'לחם',
    'פיתה',
    'בייגל',
    'לחמניה',
    'בגט',
    'טוסט',
    'טורטיה',
    'פריכיות',
  ],
  ['rice', 'אורז'],
  ['pasta', 'spaghetti', 'noodles', 'פסטה', 'ספגטי', 'נודלס'],
  ['potato', 'fries', 'פירה', 'תפוח אדמה'],
  [
    'oatmeal',
    'oats',
    'quinoa',
    'couscous',
    'bulgur',
    'barley',
    'buckwheat',
    'שיבולת',
    'קוואקר',
    'קינואה',
    'קוסקוס',
    'כוסמת',
    'פתיתים',
  ],
  ['chicken', 'turkey', 'עוף', 'הודו', 'שניצל'],
  ['beef', 'steak', 'בקר', 'בשר', 'אנטריקוט', 'אסאדו'],
  [
    'salmon',
    'tuna',
    'fish',
    'cod',
    'shrimp',
    'דג',
    'סלמון',
    'טונה',
    'אמנון',
  ],
  ['egg', 'ביצה', 'ביצים'],
]

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[״׳'"]/g, '')
    .replace(/&quot;/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegex(term: string) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function includesTerm(haystack: string, term: string) {
  const needle = normalize(term)
  if (!needle) return false
  if (needle === 'חלב') return /חלב(?!ון)/.test(haystack)
  if (
    /[\u0590-\u05FF]/.test(needle) ||
    needle.includes(' ') ||
    needle.length >= 5
  ) {
    return haystack.includes(needle)
  }
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(needle)}([^a-z0-9]|$)`)
  return re.test(haystack)
}

function haystackOf(item: { name?: unknown; searchTerms?: string[] }) {
  const parts: string[] = [...(item.searchTerms || [])]
  const name = item.name
  if (typeof name === 'string') parts.push(name)
  else if (name && typeof name === 'object') {
    const localized = name as { eng?: string; he?: string; default?: string }
    parts.push(localized.eng || '', localized.he || '', localized.default || '')
  }
  return normalize(parts.filter(Boolean).join(' '))
}

export function classifyItemCategories(item: {
  name?: unknown
  searchTerms?: string[]
}): ItemCategoryId[] {
  const name =
    typeof item.name === 'string'
      ? item.name
      : (item.name as { eng?: string } | undefined)?.eng || ''
  const curated = CURATED_CATEGORIES[normalize(name)]
  if (curated) return [...curated]

  const haystack = haystackOf(item)
  if (!haystack) return []

  const found: ItemCategoryId[] = []
  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => includesTerm(haystack, keyword))) {
      found.push(rule.category)
    }
  }
  return found
}

export function isItemCategoryId(value: string): value is ItemCategoryId {
  return (ITEM_CATEGORY_IDS as readonly string[]).includes(value)
}

export function normalizeCategories(value: unknown): ItemCategoryId[] {
  if (!Array.isArray(value)) return []
  const next: ItemCategoryId[] = []
  for (const entry of value) {
    if (typeof entry !== 'string' || !isItemCategoryId(entry)) continue
    if (!next.includes(entry)) next.push(entry)
  }
  return next
}

export function normalizeFoodQuery(value: string) {
  return normalize(value)
}

let cachedFoodKeywords: Set<string> | null = null

export function foodKeywordSet(): Set<string> {
  if (cachedFoodKeywords) return cachedFoodKeywords
  const next = new Set<string>()
  const add = (value: string) => {
    const normalized = normalize(value)
    if (normalized) next.add(normalized)
  }
  for (const rule of RULES) {
    rule.keywords.forEach(add)
  }
  for (const labels of Object.values(ITEM_CATEGORY_LABELS)) {
    add(labels.eng)
    add(labels.he)
    labels.aliases.forEach(add)
  }
  cachedFoodKeywords = next
  return next
}

export function categoryIdForLabel(term: string): ItemCategoryId | null {
  const query = normalize(term)
  if (!query) return null
  for (const id of ITEM_CATEGORY_IDS) {
    const labels = ITEM_CATEGORY_LABELS[id]
    const candidates = [id, labels.eng, labels.he, ...labels.aliases].map(
      normalize
    )
    if (candidates.includes(query)) return id
  }
  return null
}

function matchingFoodKeywords(haystack: string) {
  const hits: { keyword: string; category: ItemCategoryId }[] = []
  for (const rule of RULES) {
    for (const keyword of rule.keywords) {
      if (!includesTerm(haystack, keyword)) continue
      hits.push({ keyword: normalize(keyword), category: rule.category })
    }
  }
  return hits.filter(
    (hit) =>
      !hits.some(
        (other) =>
          other.keyword.length > hit.keyword.length &&
          other.keyword.includes(hit.keyword)
      )
  )
}

export function relatedFoodSearch(texts: string[]): {
  categories: ItemCategoryId[]
  terms: string[]
} {
  const haystack = normalize(texts.filter(Boolean).join(' '))
  if (!haystack) return { categories: [], terms: [] }

  const hits = matchingFoodKeywords(haystack)
  const categories: ItemCategoryId[] = []
  for (const hit of hits) {
    if (!categories.includes(hit.category)) categories.push(hit.category)
  }

  if (!categories.length) {
    for (const text of texts) {
      const label = categoryIdForLabel(text)
      if (label && !categories.includes(label)) categories.push(label)
    }
  }

  const hitKeywords = new Set(hits.map((hit) => hit.keyword))
  const terms: string[] = []
  for (const family of FOOD_FAMILIES) {
    const matched = family.some((term) => hitKeywords.has(normalize(term)))
    if (!matched) continue
    for (const term of family) {
      const normalized = normalize(term)
      if (normalized && !terms.includes(normalized)) terms.push(normalized)
    }
  }

  return { categories, terms }
}
