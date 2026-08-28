import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import jwt from 'jsonwebtoken'
import { GoogleHealthSnapshotService } from '../../api/health/google-health-snapshot.service'
import { logger } from '../logger.service'
import type { JWTPayload } from '../../middleware/auth.middleware'
import { HealthSocketGateway } from './health-socket.gateway'
import { ChatSocketGateway } from './chat-socket.gateway'
import { MessageService } from '../../api/message/message.service'

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
])

let io: Server | null = null

export function getSocketIO(): Server | null {
  return io
}

function verifySocketToken(token: unknown): JWTPayload | null {
  if (typeof token !== 'string' || !token) {
    return null
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JWTPayload

    if (decoded.isGuest) {
      return null
    }

    if (!decoded._id && !decoded.id) {
      return null
    }

    return decoded
  } catch {
    return null
  }
}

function getUserIdFromPayload(payload: JWTPayload): string {
  return String(payload._id || payload.id)
}

export const setupSocketAPI = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true)
          return
        }

        callback(null, false)
      },
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const decoded = verifySocketToken(socket.handshake.auth?.token)
    if (!decoded) {
      next(new Error('Unauthorized'))
      return
    }

    socket.data.userId = getUserIdFromPayload(decoded)
    next()
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string
    const room = HealthSocketGateway.getUserRoom(userId)

    socket.join(room)
    logger.info(`Client connected: ${socket.id} room=${room}`)

    void emitSnapshotOnConnect(socket, userId)

    socket.on('join-room', (requestedRoom: string) => {
      if (socket.rooms.has(requestedRoom)) return
      socket.join(requestedRoom)
      logger.info(`Client: ${socket.id} joined room: ${requestedRoom}`)
    })

    socket.on('leave-room', (requestedRoom: string) => {
      socket.leave(requestedRoom)
      logger.info(`Client: ${socket.id} left room: ${requestedRoom}`)
    })

    socket.on(
      'exercise-chat:join',
      async (data: { workoutId?: string; exerciseId?: string }) => {
        const workoutId = data?.workoutId
        const exerciseId = data?.exerciseId
        if (!workoutId || !exerciseId) return
        try {
          await MessageService.assertCanAccessWorkout(userId, workoutId)
          socket.join(ChatSocketGateway.getRoom(workoutId, exerciseId))
        } catch (err) {
          logger.error('Failed to join exercise chat room', err)
        }
      }
    )

    socket.on(
      'exercise-chat:leave',
      (data: { workoutId?: string; exerciseId?: string }) => {
        const workoutId = data?.workoutId
        const exerciseId = data?.exerciseId
        if (!workoutId || !exerciseId) return
        socket.leave(ChatSocketGateway.getRoom(workoutId, exerciseId))
      }
    )

    socket.on('chat-send-msg', (data: { room: string; msg: unknown }) => {
      logger.info(
        `New chat msg from socket [${socket.id}] in room [${data.room}]`
      )
      io?.to(data.room).emit('chat-add-msg', data.msg)
    })

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`)
    })
  })
}

async function emitSnapshotOnConnect(
  socket: import('socket.io').Socket,
  userId: string
) {
  try {
    const snapshot = await GoogleHealthSnapshotService.findTodaySnapshot(userId)
    if (snapshot) {
      socket.emit('health:snapshot', snapshot)
    }
  } catch (err) {
    logger.error('Failed to emit health snapshot on connect', err)
  }
}
