"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HEALTH_SYNC_END_HOUR = exports.HEALTH_SYNC_START_HOUR = exports.HEALTH_SYNC_TIMEZONE = void 0;
exports.isWithinSyncWindow = isWithinSyncWindow;
exports.getIsraelDateKey = getIsraelDateKey;
exports.HEALTH_SYNC_TIMEZONE = 'Asia/Jerusalem';
exports.HEALTH_SYNC_START_HOUR = 8;
exports.HEALTH_SYNC_END_HOUR = 20;
function getSyncWindowParts(now, timezone = exports.HEALTH_SYNC_TIMEZONE) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
    return { hour, minute };
}
function isWithinSyncWindow(now = new Date(), timezone = exports.HEALTH_SYNC_TIMEZONE, startHour = exports.HEALTH_SYNC_START_HOUR, endHour = exports.HEALTH_SYNC_END_HOUR) {
    const { hour, minute } = getSyncWindowParts(now, timezone);
    const totalMinutes = hour * 60 + minute;
    const startMinutes = startHour * 60;
    const endMinutes = endHour * 60;
    return totalMinutes >= startMinutes && totalMinutes < endMinutes;
}
function getIsraelDateKey(now = new Date(), timezone = exports.HEALTH_SYNC_TIMEZONE) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
}
