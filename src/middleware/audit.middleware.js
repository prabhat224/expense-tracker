import { writeAudit } from '../services/postgresService.js'

// Usage: router.post('/', protect, audit('CREATE', 'budget'), createBudget)
export const audit = (action, entity) => async (req, res, next) => {
  // Intercept res.json to capture the response entity ID
  const originalJson = res.json.bind(res)

  res.json = (body) => {
    // After response sent, log the audit event
    const entityId = body?.data?.budget?.id
                  || body?.data?.expense?.id
                  || body?.data?.customer?.id
                  || body?.data?.order?.id
                  || body?.data?.task?.id
                  || body?.data?.transaction?.id
                  || null

    if (req.user) {
      writeAudit({
        userId:    req.user.id,
        action,
        entity,
        entityId,
        payload:   ['CREATE','UPDATE'].includes(action) ? req.body : null,
        ip:        req.ip,
        userAgent: req.headers['user-agent'],
      })
    }

    return originalJson(body)
  }

  next()
}
