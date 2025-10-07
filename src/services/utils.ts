export function getDateFromISO(isoString: string) {
  const date = new Date(isoString)
  return date.toISOString().split('T')[0]
}

export function makeId(length: number = 6): string {
  let txt = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < length; i++) {
    txt += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return txt
}
