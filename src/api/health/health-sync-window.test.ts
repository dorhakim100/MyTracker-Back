import {
  getIsraelDateKey,
  isWithinSyncWindow,
} from './health-sync-window'

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

const outsideBeforeWindow = new Date('2026-07-03T04:59:00.000Z')
const insideAtStart = new Date('2026-07-03T05:00:00.000Z')
const insideBeforeEnd = new Date('2026-07-03T16:59:00.000Z')
const outsideAtEnd = new Date('2026-07-03T17:00:00.000Z')

assert(
  !isWithinSyncWindow(outsideBeforeWindow),
  '07:59 Asia/Jerusalem should be outside sync window'
)
assert(
  isWithinSyncWindow(insideAtStart),
  '08:00 Asia/Jerusalem should be inside sync window'
)
assert(
  isWithinSyncWindow(insideBeforeEnd),
  '19:59 Asia/Jerusalem should be inside sync window'
)
assert(
  !isWithinSyncWindow(outsideAtEnd),
  '20:00 Asia/Jerusalem should be outside sync window'
)

assert(
  getIsraelDateKey(new Date('2026-07-03T22:00:00.000Z')) === '2026-07-04',
  'Israel date key should follow Asia/Jerusalem calendar day'
)

console.log('health-sync-window tests passed')
