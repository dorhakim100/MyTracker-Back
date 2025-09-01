"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDateFromISO = getDateFromISO;
function getDateFromISO(isoString) {
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
}
