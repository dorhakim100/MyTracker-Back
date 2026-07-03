"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketAPI = void 0;
exports.getSocketIO = getSocketIO;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_health_snapshot_service_1 = require("../../api/health/google-health-snapshot.service");
const logger_service_1 = require("../logger.service");
const health_socket_gateway_1 = require("./health-socket.gateway");
const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://localhost',
    'http://localhost',
    'capacitor://localhost',
    'ionic://localhost',
    'https://mytracker-j6fc.onrender.com',
]);
let io = null;
function getSocketIO() {
    return io;
}
function verifySocketToken(token) {
    if (typeof token !== 'string' || !token) {
        return null;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.isGuest) {
            return null;
        }
        if (!decoded._id && !decoded.id) {
            return null;
        }
        return decoded;
    }
    catch {
        return null;
    }
}
function getUserIdFromPayload(payload) {
    return String(payload._id || payload.id);
}
const setupSocketAPI = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.has(origin)) {
                    callback(null, true);
                    return;
                }
                callback(null, false);
            },
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const decoded = verifySocketToken(socket.handshake.auth?.token);
        if (!decoded) {
            next(new Error('Unauthorized'));
            return;
        }
        socket.data.userId = getUserIdFromPayload(decoded);
        next();
    });
    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        const room = health_socket_gateway_1.HealthSocketGateway.getUserRoom(userId);
        socket.join(room);
        logger_service_1.logger.info(`Client connected: ${socket.id} room=${room}`);
        void emitSnapshotOnConnect(socket, userId);
        socket.on('join-room', (requestedRoom) => {
            if (socket.rooms.has(requestedRoom))
                return;
            socket.join(requestedRoom);
            logger_service_1.logger.info(`Client: ${socket.id} joined room: ${requestedRoom}`);
        });
        socket.on('leave-room', (requestedRoom) => {
            socket.leave(requestedRoom);
            logger_service_1.logger.info(`Client: ${socket.id} left room: ${requestedRoom}`);
        });
        socket.on('chat-send-msg', (data) => {
            logger_service_1.logger.info(`New chat msg from socket [${socket.id}] in room [${data.room}]`);
            io?.to(data.room).emit('chat-add-msg', data.msg);
        });
        socket.on('disconnect', () => {
            logger_service_1.logger.info(`Client disconnected: ${socket.id}`);
        });
    });
};
exports.setupSocketAPI = setupSocketAPI;
async function emitSnapshotOnConnect(socket, userId) {
    try {
        const snapshot = await google_health_snapshot_service_1.GoogleHealthSnapshotService.findTodaySnapshot(userId);
        if (snapshot) {
            socket.emit('health:snapshot', snapshot);
        }
    }
    catch (err) {
        logger_service_1.logger.error('Failed to emit health snapshot on connect', err);
    }
}
