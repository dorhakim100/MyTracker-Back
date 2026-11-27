import { foodKeywordSet, normalizeFoodQuery } from './item-categories'

const HEBREW_CLITICS = new Set(['ו', 'ב', 'ל', 'מ', 'כ', 'ש', 'ה'])

export function escapeSearchRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ה is the definite article ("הלחמניה" → "לחמניה"). Other prefixes are stripped
// only when the remainder is itself a known food, so "לחם" and "בשר" stay intact.
function allowHebrewStrip(
  current: string,
  prefix: string,
  rest: string,
  keywords: Set<string>
) {
  if (rest.length < 2) return false
  if (keywords.has(rest)) return true
  if (keywords.has(current)) return false
  if (prefix === 'ה' && rest.length >= 3) return true
  if (rest.startsWith('ה') && rest.length >= 4) return true
  return false
}

function collectHebrewStems(
  word: string,
  keywords: Set<string>,
  into: Set<string>
) {
  const queue = [word]
  const seen = new Set<string>([word])
  while (queue.length) {
    const current = queue.pop() as string
    if (current.length < 4) continue
    const prefix = current[0]
    if (!HEBREW_CLITICS.has(prefix)) continue
    const rest = current.slice(1)
    if (!allowHebrewStrip(current, prefix, rest, keywords)) continue
    if (seen.has(rest)) continue
    seen.add(rest)
    into.add(rest)
    queue.push(rest)
  }
}

function addHebrewPlurals(word: string, keywords: Set<string>, into: Set<string>) {
  if (word.length < 4 || !/[\u0590-\u05FF]/.test(word)) return
  if (word.endsWith('ות')) {
    const stem = word.slice(0, -2)
    into.add(`${stem}ה`)
    if (keywords.has(stem)) into.add(stem)
    return
  }
  if (word.endsWith('ים')) {
    const stem = word.slice(0, -2)
    into.add(stem)
    const feminine = `${stem}ה`
    if (keywords.has(feminine)) into.add(feminine)
    return
  }
  if (word.endsWith('ה')) {
    into.add(`${word.slice(0, -1)}ות`)
    const irregular = `${word.slice(0, -1)}ים`
    if (keywords.has(irregular)) into.add(irregular)
  }
}

function addEnglishPlurals(token: string, into: Set<string>) {
  if (!/[a-z]/.test(token)) return
  if (token.endsWith('ies') && token.length > 4) {
    into.add(`${token.slice(0, -3)}y`)
  }
  if (token.endsWith('es') && token.length > 4) {
    into.add(token.slice(0, -2))
  }
  if (token.endsWith('s') && token.length > 3) {
    into.add(token.slice(0, -1))
  }
  if (token.endsWith('y') && token.length > 3) {
    into.add(`${token.slice(0, -1)}ies`)
  }
  if (!token.endsWith('s')) {
    into.add(`${token}s`)
  }
}

export function expandSearchToken(token: string, keywords = foodKeywordSet()) {
  const forms = new Set<string>([token])
  if (/[\u0590-\u05FF]/.test(token)) {
    collectHebrewStems(token, keywords, forms)
    for (const form of [...forms]) addHebrewPlurals(form, keywords, forms)
    for (const form of [...forms]) {
      if (!form.startsWith('ה') && form.length >= 2) forms.add(`ה${form}`)
    }
  }
  addEnglishPlurals(token, forms)
  return [...forms]
}

export function getSearchVariants(term: string): string[] {
  const normalized = normalizeFoodQuery(term)
  if (!normalized) return []

  const keywords = foodKeywordSet()
  const words = normalized.split(/\s+/).filter(Boolean)
  const variants = new Set<string>([normalized])

  words.forEach((word, index) => {
    for (const form of expandSearchToken(word, keywords)) {
      if (form === word) continue
      const next = words.slice()
      next[index] = form
      variants.add(next.join(' '))
    }
  })

  return [...variants].filter(Boolean).slice(0, 16)
}

export function searchTermPattern(term: string): string {
  return getSearchVariants(term).map(escapeSearchRegex).join('|')
}

export function relatedTermsPattern(terms: string[]): string {
  return terms
    .map((term) => {
      const escaped = escapeSearchRegex(term)
      if (/^[a-z0-9]+$/.test(term) && term.length < 5) {
        return `(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`
      }
      return escaped
    })
    .join('|')
}
