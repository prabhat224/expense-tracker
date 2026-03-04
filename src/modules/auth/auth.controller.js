import { registerUser, loginUser, refreshAccessToken, logoutUser } from './auth.service.js'
import { successResponse, errorResponse } from '../../utils/response.js'

export const register = async (req, res, next) => {
  try {
    const data = await registerUser(req.body)
    return successResponse(res, data, 'User registered successfully.', 201)
  } catch (err) { next(err) }
}

export const login = async (req, res, next) => {
  try {
    const data = await loginUser(req.body)
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    })
    return successResponse(res, { accessToken: data.accessToken, user: data.user }, 'Login successful.')
  } catch (err) { next(err) }
}

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    const tokens = await refreshAccessToken(refreshToken)
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    })
    return successResponse(res, { accessToken: tokens.accessToken }, 'Token refreshed.')
  } catch (err) { next(err) }
}

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    await logoutUser(req.user.id, refreshToken)
    res.clearCookie('refreshToken')
    return successResponse(res, null, 'Logged out successfully.')
  } catch (err) { next(err) }
}

export const getMe = async (req, res) => {
  return successResponse(res, { user: req.user }, 'User fetched.')
}
