import prisma from '../config/prisma.js'
import { verifyToken } from '../utils/jwt.js'
import { getCache, setCache } from '../config/redis.js'

export const protect = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided.' })
    }

    const decoded = verifyToken(token)

    // Try cache first
    const cacheKey = `user:${decoded.id}`
    let user       = await getCache(cacheKey)

    if (!user) {
      user = await prisma.user.findUnique({
        where:  { id: decoded.id },
        select: { id: true, username: true, email: true, role: true },
      })
      if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' })
      await setCache(cacheKey, user, 300) // cache 5 min
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError')  return res.status(401).json({ success: false, message: 'Invalid token.' })
    if (error.name === 'TokenExpiredError')  return res.status(401).json({ success: false, message: 'Token expired. Please refresh.' })
    next(error)
  }
}

export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'You do not have permission.' })
  }
  next()
}
