"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthSocketGateway = void 0;
const socket_service_1 = require("./socket.service");
class HealthSocketGateway {
    static getUserRoom(userId) {
        return `user:${userId}`;
    }
    static emitHealthUpdate(userId, snapshot) {
        const io = (0, socket_service_1.getSocketIO)();
        if (!io)
            return;
        io.to(HealthSocketGateway.getUserRoom(userId)).emit('health:update', snapshot);
    }
}
exports.HealthSocketGateway = HealthSocketGateway;
