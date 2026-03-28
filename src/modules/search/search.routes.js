import { Router } from 'express'
import { searchExpenses, getElasticStatus } from '../../services/elasticService.js'
import { protect } from '../../middleware/auth.middleware.js'
import { successResponse } from '../../utils/response.js'
import prisma from '../../config/prisma.js'

const router = Router()

// DB-based search across customers, budgets, and expenses
const dbSearch = async (q, ownerId) => {
  if (!q) return []

  const term = { contains: q }

  const [customers, budgets, expenses] = await Promise.all([
    prisma.customer.findMany({
      where: { ownerId, OR: [{ name: term }, { email: term }, { phone: term }] },
      take: 10,
    }),
    prisma.budget.findMany({
      where: { ownerId, OR: [{ name: term }, { description: term }] },
      take: 10,
    }),
    prisma.expense.findMany({
      where: { ownerId, OR: [{ description: term }, { category: term }] },
      take: 10,
    }),
  ])

  return [
    ...customers.map(c => ({ ...c, _type: 'customer' })),
    ...budgets.map(b   => ({ ...b, _type: 'budget'   })),
    ...expenses.map(e  => ({ ...e, _type: 'expense'  })),
  ]
}

router.get('/', protect, async (req, res, next) => {
  try {
    const { q, category, minAmount, maxAmount, page = 1, limit = 20 } = req.query
    const from = (Number(page) - 1) * Number(limit)

    // Always run DB search for customers + budgets + expenses
    const dbResults = await dbSearch(q, req.user.id)

    // Supplement with Elasticsearch expense results if available
    let esResults = { total: 0, results: [] }
    if (getElasticStatus()) {
      esResults = await searchExpenses({
        query: q, ownerId: req.user.id, category, minAmount, maxAmount, from, size: Number(limit),
      })
    }

    // Merge: ES results take priority for expenses; DB results add customers/budgets
    const esIds = new Set(esResults.results.map(r => `expense-${r.id}`))
    const merged = [
      ...esResults.results.map(r => ({ ...r, _type: 'expense' })),
      ...dbResults.filter(r => !(r._type === 'expense' && esIds.has(`expense-${r.id}`))),
    ]

    const total = merged.length

    return successResponse(res, {
      results: merged,
      total,
      elasticEnabled: getElasticStatus(),
      pagination: {
        page:       Number(page),
        limit:      Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) { next(err) }
})

export default router
