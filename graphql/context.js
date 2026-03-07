import { verifyToken } from '../src/utils/jwt.js'

export const buildContext = (req) => {
  try {
    const auth  = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { userId: null }
    const decoded = verifyToken(token)
    return { userId: decoded.id, user: decoded }
  } catch {
    return { userId: null }
  }
}
