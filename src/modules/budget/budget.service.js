import prisma from '../../config/prisma.js'
import { getCache, setCache, deleteCachePattern } from '../../config/redis.js'
import { getPagination, paginatedResponse } from '../../utils/pagination.js'
import { publishEvent, TOPICS } from '../../services/kafkaService.js'

const CACHE_TTL = 120

export const getAllBudgets = async (ownerId, query = {}) => {
  const { page, limit, skip } = getPagination(query)
  const { category, search, sort = 'createdAt', order = 'desc' } = query

  const cacheKey = `budgets:${ownerId}:${page}:${limit}:${category||''}:${search||''}:${sort}:${order}`
  const cached   = await getCache(cacheKey)
  if (cached) return cached

  const where = {
    ownerId,
    ...(category && { category }),
    ...(search   && { name: { contains: search } }),
  }

  const [budgets, total] = await prisma.$transaction([
    prisma.budget.findMany({ where, orderBy: { [sort]: order }, skip, take: limit }),
    prisma.budget.count({ where }),
  ])

  const result = paginatedResponse(budgets, total, page, limit)
  await setCache(cacheKey, result, CACHE_TTL)
  return result
}

export const getBudgetById = async (id, ownerId) => {
  const cacheKey = `budget:${id}:${ownerId}`
  const cached   = await getCache(cacheKey)
  if (cached) return cached

  const budget = await prisma.budget.findFirst({
    where:   { id, ownerId },
    include: { expenses: { orderBy: { createdAt: 'desc' }, take: 5 } },
  })

  if (budget) await setCache(cacheKey, budget, CACHE_TTL)
  return budget
}

export const createBudget = async (data, ownerId) => {
  const budget = await prisma.budget.create({
    data: { ...data, limit: Number(data.limit), ownerId },
  })

  await deleteCachePattern(`budgets:${ownerId}:*`)

  // 🔔 Emit Kafka event
  await publishEvent(TOPICS.BUDGET_EVENTS, {
    type:   'BUDGET_CREATED',
    userId: ownerId,
    data:   { id: budget.id, name: budget.name, limit: budget.limit },
  })

  return budget
}

export const updateBudget = async (id, ownerId, data) => {
  await prisma.budget.updateMany({ where: { id, ownerId }, data })
  await deleteCachePattern(`budgets:${ownerId}:*`)
  await deleteCachePattern(`budget:${id}:*`)

  // Check if budget is nearing limit and warn user
  const budget = await prisma.budget.findFirst({ where: { id, ownerId } })
  if (budget) {
    const pct = (Number(budget.spent) / Number(budget.limit)) * 100
    if (pct >= 80) {
      await publishEvent(TOPICS.BUDGET_EVENTS, {
        type:   'BUDGET_LIMIT_WARNING',
        userId: ownerId,
        data:   { id: budget.id, name: budget.name, percentage: Math.round(pct) },
      })
    }
  }
}

export const deleteBudget = async (id, ownerId) => {
  const result = await prisma.budget.deleteMany({ where: { id, ownerId } })
  await deleteCachePattern(`budgets:${ownerId}:*`)
  await deleteCachePattern(`budget:${id}:*`)
  return result
}
