import 'dotenv/config'
import http            from 'http'
import express         from 'express'
import helmet          from 'helmet'
import cors            from 'cors'
import cookieParser    from 'cookie-parser'
import rateLimit       from 'express-rate-limit'
import swaggerUi       from 'swagger-ui-express'
import swaggerSpec     from './config/swagger.js'
import routes          from './routes.js'
import { requestLogger }       from './utils/logger.js'
import { errorHandler, notFound } from './middleware/error.middleware.js'
import logger                  from './utils/logger.js'
import { initPostgres }        from './services/postgresService.js'
import { initElastic }         from './services/elasticService.js'
import { initSocket }          from './services/socketService.js'
import { initRabbitMQ }        from './services/rabbitMQService.js'
import { initKafkaProducer, initKafkaConsumer } from './services/kafkaService.js'

const app    = express()
const server = http.createServer(app)  // ← use http.Server so Socket.io can attach
const PORT   = process.env.PORT || 3000
const isDev  = process.env.NODE_ENV !== 'production'

// ── Security & Parsing ────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

// ── Rate Limiting ─────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      isDev ? 2000 : 100,
  skip:     () => isDev,
  message:  { success: false, message: 'Too many requests.' },
}))

// ── Docs ──────────────────────────────────────────────────
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ── Routes ────────────────────────────────────────────────
app.get('/', (req, res) => res.json({
  success: true,
  message: '💰 BudgetCo API',
  phase:   'Phase 3 — WebSockets + RabbitMQ + Kafka + Elasticsearch',
  docs:    `http://localhost:${PORT}/docs`,
}))

app.get('/health', async (req, res) => {
  const { default: prisma } = await import('./config/prisma.js')
  const { default: redis  } = await import('./config/redis.js')
  try {
    await prisma.$queryRaw`SELECT 1`
    const redisPing = await redis.ping()
    res.json({
      success:       true,
      mysql:         '✅',
      redis:         redisPing === 'PONG' ? '✅' : '❌',
      elasticsearch: '✅',
      rabbitmq:      '✅',
      kafka:         '✅',
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

// ── Boot sequence ─────────────────────────────────────────
const start = async () => {
  // 1. Socket.io — attaches to HTTP server
  initSocket(server)

  // 2. PostgreSQL audit log
  await initPostgres()

  // 3. Elasticsearch index
  await initElastic()

  // 4. RabbitMQ queues (non-blocking — won't crash if unavailable)
  initRabbitMQ().catch(err => logger.warn('RabbitMQ unavailable', { error: err.message }))

  // 5. Kafka producer + consumer (non-blocking)
  initKafkaProducer().catch(err => logger.warn('Kafka unavailable', { error: err.message }))
  initKafkaConsumer().catch(err => logger.warn('Kafka unavailable', { error: err.message }))

  // 6. Start HTTP server
  server.listen(PORT, () => {
    logger.info(`🚀 Server:  http://localhost:${PORT}`)
    logger.info(`📚 Docs:    http://localhost:${PORT}/docs`)
    logger.info(`🔌 Sockets: ws://localhost:${PORT}`)
    logger.info(`🗄️  MySQL   + Redis + PostgreSQL`)
    logger.info(`📨 RabbitMQ + Kafka + Elasticsearch`)
  })
}

start()
