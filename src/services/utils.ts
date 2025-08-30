export function getDateFromISO(isoString: string) {
  const date = new Date(isoString)
  return date.toISOString().split('T')[0]
}
