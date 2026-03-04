import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'
import routes from './routes.js'
import { requestLogger } from './utils/logger.js'
import { errorHandler, notFound } from './middleware/error.middleware.js'
import logger from './utils/logger.js'

const app  = express()
const PORT = process.env.PORT || 3000

// ── Security & Parsing ────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3001', credentials: true }))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Request Logger ────────────────────────────────────────
app.use(requestLogger)

// ── Rate Limiting ─────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Too many requests. Try again in 15 minutes.' },
}))

// ── Docs ──────────────────────────────────────────────────
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ── Routes ────────────────────────────────────────────────
app.get('/', (req, res) => res.json({
  success: true,
  message: '💰 BudgetCo API v2',
  docs:    `http://localhost:${PORT}/docs`,
  phase:   'Phase 2 — Redis + Zod + Pagination + Refresh Tokens + Winston',
}))

app.get('/health', async (req, res) => {
  const { default: prisma } = await import('./config/prisma.js')
  const { default: redis  } = await import('./config/redis.js')
  try {
    await prisma.$queryRaw`SELECT 1`
    const redisPing = await redis.ping()
    res.json({ success: true, mysql: '✅', redis: redisPing === 'PONG' ? '✅' : '❌' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.use('/api', routes)

// ── Error Handling ────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 Server running at http://localhost:${PORT}`)
  logger.info(`📚 Docs at http://localhost:${PORT}/docs`)
  logger.info(`🗄️  MySQL via Prisma`)
  logger.info(`⚡ Redis cache active`)
})
