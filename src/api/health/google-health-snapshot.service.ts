import { User } from '../user/user.model'
import { GoogleHealthService } from './google-health.service'
import { GoogleHealthSnapshot } from './google-health-snapshot.model'
import { getIsraelDateKey } from './health-sync-window'
import { HealthSocketGateway } from '../../services/socket/health-socket.gateway'
import type {
  GoogleHealthSnapshotResponse,
  TodayActivitySummaryResponse,
} from './google-health.types'

type SyncUserSnapshotResult =
  | { status: 'updated'; changed: boolean }
  | { status: 'skipped'; reason: 'not_connected' | 'fetch_error' }

export class GoogleHealthSnapshotService {
  static async findTodaySnapshot(
    userId: string,
    date: string = getIsraelDateKey()
  ): Promise<GoogleHealthSnapshotResponse | null> {
    const snapshot = await GoogleHealthSnapshot.findOne({ userId, date })

    if (!snapshot) {
      return null
    }

    return toSnapshotResponse(snapshot)
  }

  static async getSnapshotForUser(
    userId: string
  ): Promise<GoogleHealthSnapshotResponse | { status: 'not_connected' } | { status: 'not_found' }> {
    const connectionStatus = await GoogleHealthService.getStatus(userId)
    if (!connectionStatus.connected) {
      return { status: 'not_connected' }
    }

    const snapshot = await GoogleHealthSnapshotService.findTodaySnapshot(userId)
    if (!snapshot) {
      return { status: 'not_found' }
    }

    return snapshot
  }

  static async syncUserSnapshot(userId: string): Promise<SyncUserSnapshotResult> {
    const connectionStatus = await GoogleHealthService.getStatus(userId)
    if (!connectionStatus.connected) {
      return { status: 'skipped', reason: 'not_connected' }
    }

    const summary =
      await GoogleHealthService.fetchTodayActivitySummaryFromGoogle(userId)

    if (summary.status !== 'ok') {
      return { status: 'skipped', reason: 'fetch_error' }
    }

    const { snapshot, changed } = await GoogleHealthSnapshotService.upsertSnapshot(
      userId,
      summary
    )

    if (changed) {
      HealthSocketGateway.emitHealthUpdate(userId, snapshot)
    }

    return { status: 'updated', changed }
  }

  static async listConnectedUserIds(): Promise<string[]> {
    const users = await User.find({
      googleId: { $exists: true, $ne: null },
      googleRefreshToken: { $exists: true, $ne: null },
    }).select('_id')

    return users.map((user) => String(user._id))
  }

  private static async upsertSnapshot(
    userId: string,
    summary: Extract<TodayActivitySummaryResponse, { status: 'ok' }>
  ): Promise<{ snapshot: GoogleHealthSnapshotResponse; changed: boolean }> {
    const date = getIsraelDateKey()
    const existing = await GoogleHealthSnapshot.findOne({ userId, date })

    const changed =
      !existing ||
      existing.steps !== summary.steps ||
      existing.activeCaloriesKcal !== summary.activeCaloriesKcal ||
      existing.distance !== summary.distance ||
      existing.flightsClimbed !== summary.flightsClimbed

    const snapshotDoc = await GoogleHealthSnapshot.findOneAndUpdate(
      { userId, date },
      {
        userId,
        date,
        steps: summary.steps,
        activeCaloriesKcal: summary.activeCaloriesKcal,
        distance: summary.distance,
        flightsClimbed: summary.flightsClimbed,
        window: summary.window,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return {
      snapshot: toSnapshotResponse(snapshotDoc),
      changed,
    }
  }
}

function toSnapshotResponse(snapshot: {
  steps: number
  activeCaloriesKcal: number
  distance: number
  flightsClimbed: number
  window: { startIso: string; endIso: string }
  updatedAt: Date
}): GoogleHealthSnapshotResponse {
  return {
    status: 'ok',
    steps: snapshot.steps,
    activeCaloriesKcal: snapshot.activeCaloriesKcal,
    distance: snapshot.distance,
    flightsClimbed: snapshot.flightsClimbed,
    window: snapshot.window,
    updatedAt: snapshot.updatedAt.toISOString(),
  }
}
