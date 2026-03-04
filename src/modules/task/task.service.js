import prisma from '../../config/prisma.js'
import { getCache, setCache, deleteCachePattern } from '../../config/redis.js'
import { getPagination, paginatedResponse } from '../../utils/pagination.js'

export const getAll = async (ownerId, query = {}) => {
  const { page, limit, skip } = getPagination(query)
  const { status, priority, sort = 'createdAt', order = 'desc' } = query

  const cacheKey = `tasks:${ownerId}:${page}:${limit}:${status || ''}:${priority || ''}`
  const cached   = await getCache(cacheKey)
  if (cached) return cached

  const where = { ownerId, ...(status && { status }), ...(priority && { priority }) }
  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({ where, orderBy: { [sort]: order }, skip, take: limit }),
    prisma.task.count({ where }),
  ])

  const result = paginatedResponse(tasks, total, page, limit)
  await setCache(cacheKey, result, 60)
  return result
}

export const getById = (id, ownerId) => prisma.task.findFirst({ where: { id, ownerId } })

export const create = async (data, ownerId) => {
  const task = await prisma.task.create({ data: { ...data, ownerId } })
  await deleteCachePattern(`tasks:${ownerId}:*`)
  return task
}

export const update = async (id, ownerId, data) => {
  await prisma.task.updateMany({ where: { id, ownerId }, data })
  await deleteCachePattern(`tasks:${ownerId}:*`)
}

export const remove = async (id, ownerId) => {
  const result = await prisma.task.deleteMany({ where: { id, ownerId } })
  await deleteCachePattern(`tasks:${ownerId}:*`)
  return result
}
