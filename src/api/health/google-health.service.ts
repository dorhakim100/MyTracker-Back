import { User } from '../user/user.model'
import { GoogleOAuthService } from '../auth/google-oauth.service'
import { logger } from '../../services/logger.service'
import type {
  CivilDateTime,
  DailyRollUpRequest,
  DailyRollUpResponse,
  GoogleHealthStatusResponse,
  TodayActivitySummaryResponse,
} from './google-health.types'
import {
  extractActiveCalories,
  extractDistanceKm,
  extractFloors,
  extractSteps,
  roundValue,
} from './google-health.normalize'
import { ActivityDayService } from './activity-day.service'
import { getIsraelDateKey } from './health-sync-window'

const GOOGLE_HEALTH_BASE_URL = 'https://health.googleapis.com/v4'

export class GoogleHealthService {
  static async getStatus(userId: string): Promise<GoogleHealthStatusResponse> {
    const user = await User.findById(userId).select(
      '+googleRefreshToken googleId email googleHealthConnectedAt'
    )

    if (!user?.googleId || !user.googleRefreshToken) {
      return {
        connected: false,
        googleEmail: user?.email ?? null,
        provider: null,
      }
    }

    return {
      connected: true,
      googleEmail: user.email,
      provider: 'google',
    }
  }

  static async disconnect(userId: string): Promise<GoogleHealthStatusResponse> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $unset: { googleRefreshToken: 1, googleHealthConnectedAt: 1 } },
      { new: true }
    ).select('email')

    return {
      connected: false,
      googleEmail: user?.email ?? null,
      provider: null,
    }
  }

  static async getTodayActivitySummary(
    userId: string
  ): Promise<TodayActivitySummaryResponse> {
    const status = await GoogleHealthService.getStatus(userId)
    if (!status.connected) {
      return { status: 'not_connected' }
    }

    return GoogleHealthService.fetchTodayActivitySummaryFromGoogle(userId)
  }

  static async fetchTodayActivitySummaryFromGoogle(
    userId: string
  ): Promise<TodayActivitySummaryResponse> {
    try {
      const accessToken = await GoogleOAuthService.getAccessTokenForUser(userId)
      const window = getLocalTodayWindow()
      const start = toCivilDateTime(window.start)
      const end = toCivilDateTime(window.endExclusive)

      const [
        stepsRollup,
        distanceRollup,
        floorsRollup,
        _activeEnergyRollup,
        totalCaloriesRollup,
      ] = await Promise.all([
        GoogleHealthService.fetchDailyRollUp(accessToken, 'steps', start, end),
        GoogleHealthService.fetchDailyRollUp(
          accessToken,
          'distance',
          start,
          end
        ),
        GoogleHealthService.fetchDailyRollUp(accessToken, 'floors', start, end),
        GoogleHealthService.fetchDailyRollUp(
          accessToken,
          'active-energy-burned',
          start,
          end
        ),
        GoogleHealthService.fetchDailyRollUp(
          accessToken,
          'total-calories',
          start,
          end
        ),
      ])

      const totalCaloris =
        totalCaloriesRollup.rollupDataPoints?.[0].totalCalories?.kcalSum || 0

      const summary = {
        status: 'ok' as const,
        steps: roundValue(extractSteps(stepsRollup.rollupDataPoints)),
        activeCaloriesKcal: roundValue(totalCaloris),
        distance: roundValue(
          extractDistanceKm(distanceRollup.rollupDataPoints),
          2
        ),
        flightsClimbed: roundValue(
          extractFloors(floorsRollup.rollupDataPoints)
        ),
        window: {
          startIso: window.start.toISOString(),
          endIso: window.endExclusive.toISOString(),
        },
      }

      try {
        await ActivityDayService.upsertDays(userId, 'google', [
          {
            date: getIsraelDateKey(),
            steps: summary.steps,
            calories: summary.activeCaloriesKcal,
          },
        ])
      } catch (saveErr) {
        logger.error('Failed to store today Google activity day', saveErr)
      }

      return summary
    } catch (err) {
      logger.error('Failed to fetch Google Health activity summary', err)
      return {
        status: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to fetch Google Health data',
      }
    }
  }

  static async fetchDailyRollUp(
    accessToken: string,
    dataType: string,
    start: CivilDateTime,
    end: CivilDateTime,
    pageToken?: string
  ): Promise<DailyRollUpResponse> {
    const body: DailyRollUpRequest = {
      range: { start, end },
      windowSizeDays: 1,
      pageToken,
    }

    const response = await fetch(
      `${GOOGLE_HEALTH_BASE_URL}/users/me/dataTypes/${dataType}/dataPoints:dailyRollUp`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `Google Health API ${dataType} failed (${response.status}): ${errorBody}`
      )
    }

    return (await response.json()) as DailyRollUpResponse
  }
}

function getLocalTodayWindow() {
  const now = new Date()
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  )
  const endExclusive = new Date(start)
  endExclusive.setDate(endExclusive.getDate() + 1)
  return { start, endExclusive, now }
}

function toCivilDateTime(date: Date): CivilDateTime {
  return {
    date: {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    },
    time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 },
  }
}
