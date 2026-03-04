import prisma from '../../config/prisma.js'
import { getCache, setCache, deleteCachePattern } from '../../config/redis.js'
import { getPagination, paginatedResponse } from '../../utils/pagination.js'

export const getAll = async (ownerId, query = {}) => {
  const { page, limit, skip } = getPagination(query)
  const { search, sort = 'createdAt', order = 'desc' } = query

  const cacheKey = `customers:${ownerId}:${page}:${limit}:${search || ''}:${sort}:${order}`
  const cached   = await getCache(cacheKey)
  if (cached) return cached

  const where = { ownerId, ...(search && { name: { contains: search } }) }
  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({ where, orderBy: { [sort]: order }, skip, take: limit }),
    prisma.customer.count({ where }),
  ])

  const result = paginatedResponse(customers, total, page, limit)
  await setCache(cacheKey, result, 120)
  return result
}

export const getById = (id, ownerId) =>
  prisma.customer.findFirst({ where: { id, ownerId } })

export const create = async (data, ownerId) => {
  const customer = await prisma.customer.create({ data: { ...data, ownerId } })
  await deleteCachePattern(`customers:${ownerId}:*`)
  return customer
}

export const update = async (id, ownerId, data) => {
  await prisma.customer.updateMany({ where: { id, ownerId }, data })
  await deleteCachePattern(`customers:${ownerId}:*`)
}

export const remove = async (id, ownerId) => {
  const result = await prisma.customer.deleteMany({ where: { id, ownerId } })
  await deleteCachePattern(`customers:${ownerId}:*`)
  return result
}
