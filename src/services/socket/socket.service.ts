import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import { logger } from '../logger.service'

export const setupSocketAPI = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        const allowed = [
          'http://127.0.0.1:3000',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          'http://localhost:5173',
          'http://127.0.0.1:8100',
          'http://localhost:8100',
          'capacitor://localhost',
          'ionic://localhost',
        ]
        if (allowed.includes(origin)) return callback(null, true)
        if (/^capacitor:\/\//.test(origin) || /^ionic:\/\//.test(origin))
          return callback(null, true)
        if (process.env.NODE_ENV === 'production') return callback(null, true)
        callback(new Error('Not allowed by Socket.IO CORS'))
      },
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`)

    socket.on('join-room', (room: string) => {
      if (socket.rooms.has(room)) return
      socket.join(room)
      logger.info(`Client: ${socket.id} joined room: ${room}`)
    })

    socket.on('leave-room', (room: string) => {
      socket.leave(room)
      logger.info(`Client: ${socket.id} left room: ${room}`)
    })

    socket.on('chat-send-msg', (data: { room: string; msg: any }) => {
      logger.info(
        `New chat msg from socket [${socket.id}] in room [${data.room}]`
      )
      io.to(data.room).emit('chat-add-msg', data.msg)
    })

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`)
    })
  })
}
