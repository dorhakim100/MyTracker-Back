const CLIENT_FORBIDDEN_USER_FIELDS = new Set([
  '_id',
  'id',
  'password',
  'trainersIds',
  'isTrainer',
  'isAddedByTrainer',
  'goals',
  'currGoal',
  'googleId',
  'googleRefreshToken',
  'googleHealthConnectedAt',
  'createdAt',
  'updatedAt',
  'meals',
  'lastWeight',
])

export function sanitizeUserUpdate(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const update: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(payload)) {
    if (key.startsWith('$')) continue
    if (CLIENT_FORBIDDEN_USER_FIELDS.has(key)) continue
    if (value === undefined) continue
    update[key] = value
  }

  return update
}
