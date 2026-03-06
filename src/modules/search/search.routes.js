import { Router } from 'express'
import { searchExpenses } from '../../services/elasticService.js'
import { protect } from '../../middleware/auth.middleware.js'
import { successResponse } from '../../utils/response.js'

const router = Router()

router.get('/', protect, async (req, res, next) => {
  try {
    const { q, category, minAmount, maxAmount, page = 1, limit = 20 } = req.query
    const from = (Number(page) - 1) * Number(limit)

    const results = await searchExpenses({
      query:     q,
      ownerId:   req.user.id,
      category,
      minAmount,
      maxAmount,
      from,
      size:      Number(limit),
    })

    return successResponse(res, {
      ...results,
      pagination: {
        page:       Number(page),
        limit:      Number(limit),
        total:      results.total,
        totalPages: Math.ceil(results.total / Number(limit)),
      },
    })
  } catch (err) { next(err) }
})

export default router
