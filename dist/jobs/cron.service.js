"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCron = startCron;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_service_1 = require("../services/logger.service");
const CRON_EXPRESSION = '0 4 * * *';
const CRON_TIMEZONE = 'Asia/Jerusalem';
function startCron(job, cronExpression = CRON_EXPRESSION, cronTimezone = CRON_TIMEZONE) {
    node_cron_1.default.schedule(cronExpression, () => {
        void job();
    }, {
        timezone: cronTimezone,
    });
    logger_service_1.logger.info(`Cron: scheduled daily at 04:00 ${cronTimezone} (${cronExpression})`);
}
