export const getPrompt = (weightKg: number) => `You are assisting a fitness tracking app. The user uploaded a photo of their body for a rough visual body-fat estimate.
weightKg: ${weightKg} kg.

Rules:
- Return a plausible body fat percentage RANGE (minPercent and maxPercent), not a single precise number.
- minPercent must be less than or equal to maxPercent.
- If the photo is unusable (fully clothed, poor lighting, not a body photo, face-only, etc.), still return a wide conservative range and explain why in note.
- note must be 1-3 short sentences: describe the physique.
- Do not identify the person. Do not comment on attractiveness.
- Typical adult ranges only; keep minPercent >= 3 and maxPercent <= 60 unless clearly unreasonable, explain in note the physique.`
