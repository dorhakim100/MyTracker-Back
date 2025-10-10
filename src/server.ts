import http from 'http'
import path from 'path'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

import { authRoutes } from './api/auth/auth.routes'
import { userRoutes } from './api/user/user.routes'
import { logRoutes } from './api/log/log.routes'
import { dayRoutes } from './api/day/day.routes'
import { mealRoutes } from './api/meal/meal.routes'
import { weightRoutes } from './api/weight/weight.routes'
import { goalRoutes } from './api/goal/goal.routes'

import { setupSocketAPI } from './services/socket/socket.service'
import { setupAsyncLocalStorage } from './middleware/setupAls.middleware'
import { logger } from './services/logger.service'

dotenv.config()

const app = express()
const server = http.createServer(app)

// Express App Config
app.set('trust proxy', 1)
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS for Web (dev/prod) and Capacitor/Ionic native apps
const allowedOrigins = [
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:8100',
  'http://localhost:8100',
  'capacitor://localhost',
  'ionic://localhost',
  'http://127.0.0.1:3030',
  'http://10.0.2.2:8100',
  'http://10.0.2.2:3000',
  'http://10.0.2.2:5173',
  'http://10.0.2.2:3030',
  'http://10.0.2.2:3000',
]

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow server-to-server or tools like curl/postman (no origin)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    // Allow Capacitor/Ionic custom URL schemes with any host
    if (/^capacitor:\/\//.test(origin) || /^ionic:\/\//.test(origin))
      return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}

app.use(cors(corsOptions))

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')))
  // app.use(express.static(path.resolve('public')))
}

app.all('*', setupAsyncLocalStorage)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/log', logRoutes)
app.use('/api/day', dayRoutes)
app.use('/api/meal', mealRoutes)
app.use('/api/weight', weightRoutes)
app.use('/api/goal', goalRoutes)

// Setup Socket.IO
setupSocketAPI(server)

// Serve frontend in production
app.get('/**', (req, res) => {
  // res.sendFile(path.resolve('public/index.html'))
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

// Database connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URL as string
    const dbName = process.env.DB_NAME
    const conn = await mongoose.connect(uri, { dbName })

    logger.info(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error)
    process.exit(1)
  }
}

// Start server
const port = process.env.PORT || 3030

connectDB().then(() => {
  server.listen(port, () => {
    logger.info('Server is running on port: ' + port)
  })
})
