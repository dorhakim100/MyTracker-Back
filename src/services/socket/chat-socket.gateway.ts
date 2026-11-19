import { getSocketIO } from './socket.service'
import { HealthSocketGateway } from './health-socket.gateway'

export class ChatSocketGateway {
  static getRoom(workoutId: string, exerciseId: string): string {
    return `workout:${workoutId}:exercise:${exerciseId}`
  }

  static getSessionRoom(workoutId: string): string {
    return `workout:${workoutId}:session`
  }

  static resolveRoom(workoutId: string, exerciseId?: string | null): string {
    if (!exerciseId) return ChatSocketGateway.getSessionRoom(workoutId)
    return ChatSocketGateway.getRoom(workoutId, exerciseId)
  }

  static emitMessageAdded(
    workoutId: string,
    exerciseId: string | null | undefined,
    message: unknown
  ): void {
    const io = getSocketIO()
    if (!io) return
    io.to(ChatSocketGateway.resolveRoom(workoutId, exerciseId)).emit(
      'exercise-chat:message-added',
      message
    )
  }

  static emitMessageUpdated(
    workoutId: string,
    exerciseId: string | null | undefined,
    message: unknown
  ): void {
    const io = getSocketIO()
    if (!io) return
    io.to(ChatSocketGateway.resolveRoom(workoutId, exerciseId)).emit(
      'exercise-chat:message-updated',
      message
    )
  }

  static emitMessageRemoved(
    workoutId: string,
    exerciseId: string | null | undefined,
    messageId: string
  ): void {
    const io = getSocketIO()
    if (!io) return
    io.to(ChatSocketGateway.resolveRoom(workoutId, exerciseId)).emit(
      'exercise-chat:message-removed',
      {
        messageId,
        workoutId,
        ...(exerciseId ? { exerciseId } : {}),
      }
    )
  }

  static emitUnread(
    userIds: string[],
    payload?: {
      workoutId: string
      exerciseId?: string
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
