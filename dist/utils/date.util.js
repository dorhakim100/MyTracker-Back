"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUtcMidnightISOString = toUtcMidnightISOString;
exports.toUtcMidnightDate = toUtcMidnightDate;
function toUtcMidnightISOString(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
    const startUtc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    return startUtc.toISOString();
}
function toUtcMidnightDate(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}
