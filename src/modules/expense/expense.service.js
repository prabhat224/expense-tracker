import prisma from '../../config/prisma.js'
import { getCache, setCache, deleteCachePattern } from '../../config/redis.js'
import { getPagination, paginatedResponse } from '../../utils/pagination.js'

export const getAllExpenses = async (ownerId, query = {}) => {
  const { page, limit, skip } = getPagination(query)
  const { category, budgetId, minAmount, maxAmount, search, sort = 'createdAt', order = 'desc' } = query

  const cacheKey = `expenses:${ownerId}:${JSON.stringify(query)}`
  const cached   = await getCache(cacheKey)
  if (cached) return cached

  const where = {
    ownerId,
    ...(category  && { category }),
    ...(budgetId  && { budgetId: Number(budgetId) }),
    ...(search    && { description: { contains: search } }),
    ...(minAmount || maxAmount) && {
      amount: {
        ...(minAmount && { gte: Number(minAmount) }),
        ...(maxAmount && { lte: Number(maxAmount) }),
      },
    },
  }

  const [expenses, total] = await prisma.$transaction([
    prisma.expense.findMany({
      where,
      include:  { budget: { select: { name: true, limit: true } } },
      orderBy:  { [sort]: order },
      skip,
      take:     limit,
    }),
    prisma.expense.count({ where }),
  ])

  const result = paginatedResponse(expenses, total, page, limit)
  await setCache(cacheKey, result, 60)
  return result
}

export const getExpensesByBudget = (budgetId, ownerId) =>
  prisma.expense.findMany({
    where:   { budgetId, ownerId },
    orderBy: { createdAt: 'desc' },
  })

export const createExpense = async ({ budgetId, description, amount, category, date }, ownerId) => {
  const budget = await prisma.budget.findFirst({ where: { id: budgetId, ownerId } })
  if (!budget) throw { status: 404, message: 'Budget not found.' }

  const [expense] = await prisma.$transaction([
    prisma.expense.create({ data: { budgetId, description, amount, category, date, ownerId } }),
    prisma.budget.update({ where: { id: budgetId }, data: { spent: { increment: amount } } }),
  ])

  await deleteCachePattern(`expenses:${ownerId}:*`)
  await deleteCachePattern(`budget:${budgetId}:*`)
  await deleteCachePattern(`budgets:${ownerId}:*`)
  return expense
}

export const updateExpense = async (id, ownerId, data) => {
  await prisma.expense.updateMany({ where: { id, ownerId }, data })
  await deleteCachePattern(`expenses:${ownerId}:*`)
}

export const deleteExpense = async (id, ownerId) => {
  const expense = await prisma.expense.findFirst({ where: { id, ownerId } })
  if (!expense) throw { status: 404, message: 'Expense not found.' }

  await prisma.$transaction([
    prisma.expense.delete({ where: { id } }),
    prisma.budget.update({ where: { id: expense.budgetId }, data: { spent: { decrement: expense.amount } } }),
  ])

  await deleteCachePattern(`expenses:${ownerId}:*`)
  await deleteCachePattern(`budget:${expense.budgetId}:*`)
  await deleteCachePattern(`budgets:${ownerId}:*`)
  return expense
}
