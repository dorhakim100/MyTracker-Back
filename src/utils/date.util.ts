export function toUtcMidnightISOString(dateInput?: string | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date()
  const startUtc = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  )
  return startUtc.toISOString()
}

export function toUtcMidnightDate(dateInput?: string | Date): Date {
  const d = dateInput ? new Date(dateInput) : new Date()
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  )
}
