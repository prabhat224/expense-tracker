import { Server } from 'socket.io'
import { verifyToken } from '../utils/jwt.js'
import logger from '../utils/logger.js'

let io

// ── Initialize Socket.io on the HTTP server ───────────────
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true,
    },
  })

  // ── Auth middleware for socket connections ────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
                || socket.handshake.headers?.authorization?.split(' ')[1]

    if (!token) return next(new Error('Authentication required'))

    try {
      const decoded  = verifyToken(token)
      socket.userId  = decoded.id
      socket.user    = decoded
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  // ── Connection handler ────────────────────────────────────
  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: user ${socket.userId}`)

    // Each user joins their own private room
    // Room name = "user:1", "user:2", etc.
    socket.join(`user:${socket.userId}`)

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: user ${socket.userId}`)
    })
  })

  logger.info('✅ Socket.io initialized')
  return io
}

// ── Emit to a specific user ───────────────────────────────
export const notifyUser = (userId, event, data) => {
  if (!io) return
  io.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  })
}

// ── Emit to ALL connected users (admin broadcast) ─────────
export const broadcast = (event, data) => {
  if (!io) return
  io.emit(event, { ...data, timestamp: new Date().toISOString() })
}

// ── Notification helper — standard notification shape ─────
export const sendNotification = (userId, { type, title, message, data = {} }) => {
  notifyUser(userId, 'notification', { type, title, message, data })
}

export const getIO = () => io
