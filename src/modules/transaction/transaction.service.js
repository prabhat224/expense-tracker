import prisma from '../../config/prisma.js'
import { getCache, setCache, deleteCachePattern } from '../../config/redis.js'
import { getPagination, paginatedResponse } from '../../utils/pagination.js'

export const getAll = async (ownerId, query = {}) => {
  const { page, limit, skip } = getPagination(query)
  const { type, minAmount, maxAmount, sort = 'createdAt', order = 'desc' } = query

  const cacheKey = `transactions:${ownerId}:${JSON.stringify(query)}`
  const cached   = await getCache(cacheKey)
  if (cached) return cached

  const where = {
    ownerId,
    ...(type && { type }),
    ...((minAmount || maxAmount) && {
      amount: {
        ...(minAmount && { gte: Number(minAmount) }),
        ...(maxAmount && { lte: Number(maxAmount) }),
      },
    }),
  }

  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({ where, orderBy: { [sort]: order }, skip, take: limit }),
    prisma.transaction.count({ where }),
  ])

  const result = paginatedResponse(transactions, total, page, limit)
  await setCache(cacheKey, result, 60)
  return result
}

export const getById = (id, ownerId) => prisma.transaction.findFirst({ where: { id, ownerId } })

export const create = async (data, ownerId) => {
  const txn = await prisma.transaction.create({ data: { ...data, ownerId } })
  await deleteCachePattern(`transactions:${ownerId}:*`)
  return txn
}

export const update = async (id, ownerId, data) => {
  await prisma.transaction.updateMany({ where: { id, ownerId }, data })
  await deleteCachePattern(`transactions:${ownerId}:*`)
}

export const remove = async (id, ownerId) => {
  const result = await prisma.transaction.deleteMany({ where: { id, ownerId } })
  await deleteCachePattern(`transactions:${ownerId}:*`)
  return result
}
