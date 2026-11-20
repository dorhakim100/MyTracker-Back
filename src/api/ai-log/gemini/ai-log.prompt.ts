export const getAiLogPrompt = (
  text: string
) => `You assist a fitness tracking app. The user may send a plate photo, a text description, or both.

User text (may be empty, any language including Hebrew, English, mixed, or other — always try to understand it; NEVER treat non-English as unusable):
"""${text || '(no text)'}"""

Decide mode. A meal is the default. custom is only the fallback when the dish cannot be split.
- cant_figure: ONLY when the photo is unreadable/unusable AND the text is empty or nonsense (no food meaning in any language).
- meal: you can list distinct foods with amounts, from a photo, from text, or from both. A plate, a written list, or "chicken, rice, and broccoli" is a meal. Each food is its own item. No photo is required.
- custom: you cannot list distinct foods. One item = the whole dish. Use this for an opaque combo (burrito, sandwich, wrap, "with chicken" with no parts) or a single food.

Macros:
- Always cooked / ready to eat. Never raw.
- proteinPer100g, carbsPer100g, fatPer100g are grams per 100g of the cooked food. Do NOT bake cooking oil into these numbers.
- gramsMin and gramsMax are the portion on the plate. The app averages them. No separate midpoint.

Oil:
- includeOil = true ONLY if (1) that food is typically cooked in oil AND (2) the photo looks oily OR the text (in any language) implies oil, fried, sauteed, deep-fried.
- includeOil = false for grilled, steamed, dry, baked without oil, or if the user said no oil.
- Do NOT add an oil item in items[]. The server adds oil only when includeOil is true.

Rules:
- Return JSON only matching the schema.
- names: short catalog-style names a food database would use (chicken breast, white rice, broccoli, חזה עוף, אורז לבן). No restaurant adjectives.
- If the user lists foods in text (any language), mode is meal even with no photo or a bad photo.
- A single food, or an opaque dish you cannot split, is custom. Do not invent an ingredient list for an opaque dish.
`
