import { Router } from 'express'
import { getAllBudgets, getBudget, createBudget, updateBudget, deleteBudget } from './budget.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { createBudgetSchema, updateBudgetSchema } from '../../validations/budget.validation.js'
import { audit } from '../../middleware/audit.middleware.js'

const router = Router()
router.use(protect)
router.route('/').get(getAllBudgets).post(validate(createBudgetSchema), audit('CREATE', 'budget'), createBudget)
router.route('/:id').get(getBudget).put(validate(updateBudgetSchema), audit('UPDATE', 'budget'), updateBudget).delete(audit('DELETE', 'budget'), deleteBudget)

export default router
