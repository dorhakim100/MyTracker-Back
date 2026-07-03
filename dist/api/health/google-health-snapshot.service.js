"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleHealthSnapshotService = void 0;
const user_model_1 = require("../user/user.model");
const google_health_service_1 = require("./google-health.service");
const google_health_snapshot_model_1 = require("./google-health-snapshot.model");
const health_sync_window_1 = require("./health-sync-window");
const health_socket_gateway_1 = require("../../services/socket/health-socket.gateway");
class GoogleHealthSnapshotService {
    static async findTodaySnapshot(userId, date = (0, health_sync_window_1.getIsraelDateKey)()) {
        const snapshot = await google_health_snapshot_model_1.GoogleHealthSnapshot.findOne({ userId, date });
        if (!snapshot) {
            return null;
        }
        return toSnapshotResponse(snapshot);
    }
    static async getSnapshotForUser(userId) {
        const connectionStatus = await google_health_service_1.GoogleHealthService.getStatus(userId);
        if (!connectionStatus.connected) {
            return { status: 'not_connected' };
        }
        const snapshot = await GoogleHealthSnapshotService.findTodaySnapshot(userId);
        if (!snapshot) {
            return { status: 'not_found' };
        }
        return snapshot;
    }
    static async syncUserSnapshot(userId) {
        const connectionStatus = await google_health_service_1.GoogleHealthService.getStatus(userId);
        if (!connectionStatus.connected) {
            return { status: 'skipped', reason: 'not_connected' };
        }
        const summary = await google_health_service_1.GoogleHealthService.fetchTodayActivitySummaryFromGoogle(userId);
        if (summary.status !== 'ok') {
            return { status: 'skipped', reason: 'fetch_error' };
        }
        const { snapshot, changed } = await GoogleHealthSnapshotService.upsertSnapshot(userId, summary);
        if (changed) {
            health_socket_gateway_1.HealthSocketGateway.emitHealthUpdate(userId, snapshot);
        }
        return { status: 'updated', changed };
    }
    static async listConnectedUserIds() {
        const users = await user_model_1.User.find({
            googleId: { $exists: true, $ne: null },
            googleRefreshToken: { $exists: true, $ne: null },
        }).select('_id');
        return users.map((user) => String(user._id));
    }
    static async upsertSnapshot(userId, summary) {
        const date = (0, health_sync_window_1.getIsraelDateKey)();
        const existing = await google_health_snapshot_model_1.GoogleHealthSnapshot.findOne({ userId, date });
        const changed = !existing ||
            existing.steps !== summary.steps ||
            existing.activeCaloriesKcal !== summary.activeCaloriesKcal ||
            existing.distance !== summary.distance ||
            existing.flightsClimbed !== summary.flightsClimbed;
        const snapshotDoc = await google_health_snapshot_model_1.GoogleHealthSnapshot.findOneAndUpdate({ userId, date }, {
            userId,
            date,
            steps: summary.steps,
            activeCaloriesKcal: summary.activeCaloriesKcal,
            distance: summary.distance,
            flightsClimbed: summary.flightsClimbed,
            window: summary.window,
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
        return {
            snapshot: toSnapshotResponse(snapshotDoc),
            changed,
        };
    }
}
exports.GoogleHealthSnapshotService = GoogleHealthSnapshotService;
function toSnapshotResponse(snapshot) {
    return {
        status: 'ok',
        steps: snapshot.steps,
        activeCaloriesKcal: snapshot.activeCaloriesKcal,
        distance: snapshot.distance,
        flightsClimbed: snapshot.flightsClimbed,
        window: snapshot.window,
        updatedAt: snapshot.updatedAt.toISOString(),
    };
}
