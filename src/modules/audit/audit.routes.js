import { Router } from 'express'
import { getAuditLog } from '../../services/postgresService.js'
import { protect, restrictTo } from '../../middleware/auth.middleware.js'
import { successResponse } from '../../utils/response.js'

const router = Router()

router.get('/', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const { entity, limit, offset } = req.query
    const logs = await getAuditLog({
      userId: req.query.userId ? Number(req.query.userId) : undefined,
      entity,
      limit:  Number(limit)  || 50,
      offset: Number(offset) || 0,
    })
    return successResponse(res, { count: logs.length, logs })
  } catch (err) { next(err) }
})

router.get('/me', protect, async (req, res, next) => {
  try {
    const logs = await getAuditLog({ userId: req.user.id })
    return successResponse(res, { count: logs.length, logs })
  } catch (err) { next(err) }
})

export default router
