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
import { workoutRoutes } from './api/workout/workout.routes'
import { sessionRoutes } from './api/session/session.routes'
import { instructionsRoutes } from './api/instructions/instructions.routes'

import { setupSocketAPI } from './services/socket/socket.service'
import { setupAsyncLocalStorage } from './middleware/setupAls.middleware'
import { logger } from './services/logger.service'

dotenv.config()

// Translate
import { translateRoutes } from './api/translate/translate.routes'

const app = express()
const server = http.createServer(app)

// Express App Config
app.set('trust proxy', 1)
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')))
  // app.use(express.static(path.resolve('public')))
} else {
  const corsOptions = {
    origin: [
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:5173',
    ],
    credentials: true,
  }
  app.use(cors(corsOptions))
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
app.use('/api/workout', workoutRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/instructions', instructionsRoutes)

app.use('/api/translate', translateRoutes)

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
