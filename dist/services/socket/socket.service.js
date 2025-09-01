"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketAPI = void 0;
const socket_io_1 = require("socket.io");
const logger_service_1 = require("../logger.service");
const setupSocketAPI = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? false
                : ['http://127.0.0.1:3000', 'http://localhost:3000'],
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        logger_service_1.logger.info(`New client connected: ${socket.id}`);
        socket.on('join-room', (room) => {
            if (socket.rooms.has(room))
                return;
            socket.join(room);
            logger_service_1.logger.info(`Client: ${socket.id} joined room: ${room}`);
        });
        socket.on('leave-room', (room) => {
            socket.leave(room);
            logger_service_1.logger.info(`Client: ${socket.id} left room: ${room}`);
        });
        socket.on('chat-send-msg', (data) => {
            logger_service_1.logger.info(`New chat msg from socket [${socket.id}] in room [${data.room}]`);
            io.to(data.room).emit('chat-add-msg', data.msg);
        });
        socket.on('disconnect', () => {
            logger_service_1.logger.info(`Client disconnected: ${socket.id}`);
        });
    });
};
exports.setupSocketAPI = setupSocketAPI;
