import { getSocketIO } from './socket.service'
import { HealthSocketGateway } from './health-socket.gateway'

export class ChatSocketGateway {
  static getRoom(workoutId: string, exerciseId: string): string {
    return `workout:${workoutId}:exercise:${exerciseId}`
  }

  static emitMessageAdded(
    workoutId: string,
    exerciseId: string,
    message: unknown
  ): void {
    const io = getSocketIO()
    if (!io) return
    io.to(ChatSocketGateway.getRoom(workoutId, exerciseId)).emit(
      'exercise-chat:message-added',
      message
    )
  }

  static emitMessageUpdated(
    workoutId: string,
    exerciseId: string,
    message: unknown
  ): void {
    const io = getSocketIO()
    if (!io) return
    io.to(ChatSocketGateway.getRoom(workoutId, exerciseId)).emit(
      'exercise-chat:message-updated',
      message
    )
  }

  static emitMessageRemoved(
    workoutId: string,
    exerciseId: string,
    messageId: string
  ): void {
    const io = getSocketIO()
    if (!io) return
    io.to(ChatSocketGateway.getRoom(workoutId, exerciseId)).emit(
      'exercise-chat:message-removed',
      { messageId, workoutId, exerciseId }
    )
  }

  static emitUnread(
    userIds: string[],
    payload?: {
      workoutId: string
      exerciseId: string
      forUserId?: string
      senderRole: 'trainer' | 'trainee'
    }
  ): void {
    const io = getSocketIO()
    if (!io) return
    const unique = [...new Set(userIds.filter(Boolean))]
    unique.forEach((userId) => {
      io.to(HealthSocketGateway.getUserRoom(userId)).emit(
        'exercise-chat:unread',
        payload
      )
    })
  }
}
