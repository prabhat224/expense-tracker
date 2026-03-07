import client from 'prom-client'

// ─── Registry ─────────────────────────────────────────────────────────────────
const register = new client.Registry()

// Default system metrics (memory, CPU, event loop)
client.collectDefaultMetrics({ register })

// ─── Custom metrics ───────────────────────────────────────────────────────────

// HTTP request counter
export const httpRequestsTotal = new client.Counter({
  name:       'http_requests_total',
  help:       'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers:  [register],
})

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name:       'http_request_duration_seconds',
  help:       'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets:    [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers:  [register],
})

// Active connections gauge
export const activeConnections = new client.Gauge({
  name:      'active_connections',
  help:      'Number of active HTTP connections',
  registers: [register],
})

// Database query counter
export const dbQueriesTotal = new client.Counter({
  name:       'db_queries_total',
  help:       'Total database queries',
  labelNames: ['operation', 'model'],
  registers:  [register],
})

// Cache hit/miss counter
export const cacheOpsTotal = new client.Counter({
  name:       'cache_ops_total',
  help:       'Redis cache operations',
  labelNames: ['operation', 'result'],   // operation: get/set/del, result: hit/miss
  registers:  [register],
})

// Business metrics
export const budgetsCreatedTotal = new client.Counter({
  name:      'budgets_created_total',
  help:      'Total budgets created',
  registers: [register],
})

export const expensesCreatedTotal = new client.Counter({
  name:      'expenses_created_total',
  help:      'Total expenses recorded',
  registers: [register],
})

export const expenseAmountTotal = new client.Counter({
  name:      'expense_amount_total',
  help:      'Total amount of all expenses in rupees',
  registers: [register],
})

// ─── Middleware: track every HTTP request ─────────────────────────────────────
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now()
  activeConnections.inc()

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const route    = req.route?.path || req.path || 'unknown'
    const labels   = { method: req.method, route, status_code: res.statusCode }

    httpRequestsTotal.inc(labels)
    httpRequestDuration.observe(labels, duration)
    activeConnections.dec()
  })

  next()
}

// ─── /metrics route handler ───────────────────────────────────────────────────
export const metricsHandler = async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
}

export default register
