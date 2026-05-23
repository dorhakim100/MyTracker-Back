export function buildBodyFatEstimatePrompt(weightKg: number): string {
  return `You estimate approximate body fat percentage from a physique photo and the user's weight.

User weight: ${weightKg} kg.

Rules:
- Respond with JSON only. No markdown fences or extra text.
- Use status "ok" when you can give a reasonable visual estimate. Provide bodyFatMin, bodyFatMax (percent, 1 decimal), and note (1-3 sentences, plain language, describe physique).
- Use status "unusable_photo" when the image is not a usable body photo (unclear, face-only, fully clothed with no visible physique, too dark, multiple people, not a person, etc.). Provide message explaining why.
- Use status "error" only for other failures. Provide message.
- bodyFatMin must be <= bodyFatMax. Typical range 3-60.
- This is a fitness estimate, not medical diagnosis. Be conservative when uncertain.

JSON shape:
{
  "status": "ok" | "unusable_photo" | "error",
  "bodyFatMin": number,
  "bodyFatMax": number,
  "note": string,
  "message": string
}`
}
