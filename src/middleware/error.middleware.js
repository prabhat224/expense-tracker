import logger from '../utils/logger.js'

export const errorHandler = (err, req, res, next) => {
  const status  = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  // Log the error
  logger.error(message, {
    requestId: req.requestId,
    userId:    req.user?.id,
    stack:     err.stack,
    path:      req.originalUrl,
    method:    req.method,
  })

  // Prisma specific errors
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'A record with that value already exists.' })
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found.' })
  }

  // Don't leak stack in production
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  })
}
