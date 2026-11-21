const GROUPS: Record<string, string[]> = {
  barbell: ['barbell', 'ez barbell', 'olympic barbell', 'trap bar'],
  dumbbell: ['dumbbell'],
  smith: ['smith machine', 'smith'],
  machine: [
    'machine',
    'leverage machine',
    'sled machine',
    'smith machine',
    'smith',
    'stepmill machine',
    'elliptical machine',
    'skierg machine',
    'upper body ergometer',
    'stationary bike',
  ],
  cable: ['cable'],
  bodyweight: ['body weight', 'bodyweight', 'weighted', 'assisted'],
  bands: ['band', 'bands', 'resistance band'],
  kettlebell: ['kettlebell'],
}

export function equipmentMatchValues(filterValue: string) {
  const id = filterValue.toLowerCase()
  return GROUPS[id] || [id]
}
