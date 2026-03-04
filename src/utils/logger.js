import winston from 'winston'
import { v4 as uuidv4 } from 'uuid'

const { combine, timestamp, printf, colorize, errors } = winston.format

const devFormat = printf(({ level, message, timestamp, stack, requestId, userId, duration }) => {
  let log = `${timestamp} [${level}]`
  if (requestId) log += ` [${requestId.slice(0, 8)}]`
  if (userId)    log += ` [user:${userId}]`
  if (duration)  log += ` [${duration}ms]`
  log += ` ${stack || message}`
  return log
})

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'HH:mm:ss' }),
  ),
  transports: [
    // Console — colored in dev
    new winston.transports.Console({
      format: combine(colorize(), devFormat),
    }),
    // Error log file
    new winston.transports.File({
      filename: 'src/utils/logs/error.log',
      level: 'error',
      format: combine(timestamp(), winston.format.json()),
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'src/utils/logs/combined.log',
      format: combine(timestamp(), winston.format.json()),
    }),
  ],
})

export default logger

// ── Request Logger Middleware ─────────────────────────────
export const requestLogger = (req, res, next) => {
  const requestId = uuidv4()
  const start     = Date.now()

  req.requestId = requestId
  res.setHeader('X-Request-Id', requestId)

  res.on('finish', () => {
    const duration = Date.now() - start
    const level    = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'

    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      requestId,
      userId:   req.user?.id,
      duration,
      ip:       req.ip,
      ua:       req.headers['user-agent']?.slice(0, 60),
    })
  })

  next()
}
