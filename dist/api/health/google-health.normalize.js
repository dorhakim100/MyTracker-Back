"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRollUpValue = extractRollUpValue;
exports.extractSteps = extractSteps;
exports.extractFloors = extractFloors;
exports.extractDistanceKm = extractDistanceKm;
exports.extractActiveCalories = extractActiveCalories;
exports.roundValue = roundValue;
function parseNumeric(value) {
    if (!value)
        return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}
function extractRollUpValue(rollupDataPoints, picker) {
    if (!rollupDataPoints?.length)
        return 0;
    return parseNumeric(picker(rollupDataPoints[0]));
}
function extractSteps(rollupDataPoints) {
    return extractRollUpValue(rollupDataPoints, (point) => point.steps?.countSum);
}
function extractFloors(rollupDataPoints) {
    return extractRollUpValue(rollupDataPoints, (point) => point.floors?.countSum);
}
function extractDistanceKm(rollupDataPoints) {
    const millimeters = extractRollUpValue(rollupDataPoints, (point) => point.distance?.millimetersSum);
    return millimeters / 1000000;
}
function extractActiveCalories(activeEnergyRollup, totalCaloriesRollup) {
    const activeEnergy = extractRollUpValue(activeEnergyRollup, (point) => point.activeEnergyBurned?.energyKilocaloriesSum ||
        point.activeEnergyBurned?.kilocaloriesSum);
    if (activeEnergy > 0)
        return activeEnergy;
    return extractRollUpValue(totalCaloriesRollup, (point) => point.totalCalories?.energyKilocaloriesSum ||
        point.totalCalories?.kilocaloriesSum);
}
function roundValue(value, digits = 0) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}
