import { Router } from 'express'
import { register, login, refresh, logout, getMe } from './auth.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { registerSchema, loginSchema } from '../../validations/auth.validation.js'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login',    validate(loginSchema),    login)
router.post('/refresh',  refresh)
router.post('/logout',   protect, logout)
router.get('/me',        protect, getMe)

export default router
