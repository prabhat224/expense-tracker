import bcrypt from 'bcryptjs'
import prisma from '../../config/prisma.js'
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../utils/jwt.js'
import { deleteCache } from '../../config/redis.js'

export const registerUser = async ({ username, email, password }) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  })
  if (existing) throw { status: 409, message: 'Email or username already exists.' }

  const hashed = await bcrypt.hash(password, 12)
  const user   = await prisma.user.create({
    data:   { username, email, password: hashed },
    select: { id: true, username: true, email: true, role: true, createdAt: true },
  })

  const accessToken  = generateAccessToken(user.id)
  const refreshToken = generateRefreshToken(user.id)

  await prisma.refreshToken.create({
    data: {
      token:     refreshToken,
      userId:    user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return { accessToken, refreshToken, user }
}

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw { status: 401, message: 'Invalid email or password.' }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) throw { status: 401, message: 'Invalid email or password.' }

  const accessToken  = generateAccessToken(user.id)
  const refreshToken = generateRefreshToken(user.id)

  await prisma.refreshToken.create({
    data: {
      token:     refreshToken,
      userId:    user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const { password: _, ...safeUser } = user
  return { accessToken, refreshToken, user: safeUser }
}

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw { status: 401, message: 'Refresh token required.' }

  const decoded = verifyToken(refreshToken)
  if (decoded.type !== 'refresh') throw { status: 401, message: 'Invalid token type.' }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
  if (!stored || stored.expiresAt < new Date()) {
    throw { status: 401, message: 'Refresh token expired or not found.' }
  }

  // Rotate — delete old, issue new
  await prisma.refreshToken.delete({ where: { token: refreshToken } })

  const newAccessToken  = generateAccessToken(decoded.id)
  const newRefreshToken = generateRefreshToken(decoded.id)

  await prisma.refreshToken.create({
    data: {
      token:     newRefreshToken,
      userId:    decoded.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

export const logoutUser = async (userId, refreshToken) => {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  }
  // Bust user cache
  await deleteCache(`user:${userId}`)
}
