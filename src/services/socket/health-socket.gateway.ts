import type { GoogleHealthSnapshotResponse } from '../../api/health/google-health.types'
import { getSocketIO } from './socket.service'

export class HealthSocketGateway {
  static getUserRoom(userId: string): string {
    return `user:${userId}`
  }

  static emitHealthUpdate(
    userId: string,
    snapshot: GoogleHealthSnapshotResponse
  ): void {
    const io = getSocketIO()
    if (!io) return

    io.to(HealthSocketGateway.getUserRoom(userId)).emit('health:update', snapshot)
  }
}
