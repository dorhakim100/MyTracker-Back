import { User } from '../api/user/user.model'

export async function canAccessUser(
  actorId: string,
  subjectId: string,
  allowTrainer = true
) {
  if (!actorId || !subjectId) return false
  if (actorId === subjectId) return true
  if (!allowTrainer) return false

  const trainee = await User.findById(subjectId).select('trainersIds').lean()
  const trainerIds = (trainee?.trainersIds || []).map(String)
  return trainerIds.includes(actorId)
}

export async function readableUserIds(actorId: string) {
  const trainees = await User.find({ trainersIds: actorId }).select('_id').lean()
  return [actorId, ...trainees.map((trainee) => String(trainee._id))]
}

export async function isTrainerAccount(actorId: string) {
  const actor = await User.findById(actorId).select('isTrainer').lean()
  return Boolean(actor?.isTrainer)
}
