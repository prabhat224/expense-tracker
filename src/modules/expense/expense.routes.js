import { Router } from 'express'
import { getAllExpenses, getExpensesByBudget, createExpense, updateExpense, deleteExpense } from './expense.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { createExpenseSchema, updateExpenseSchema } from '../../validations/expense.validation.js'
import { audit } from '../../middleware/audit.middleware.js'

const router = Router()
router.use(protect)
router.route('/').get(getAllExpenses).post(validate(createExpenseSchema), audit('CREATE', 'expense'), createExpense)
router.get('/budget/:budgetId', getExpensesByBudget)
router.route('/:id').put(validate(updateExpenseSchema), audit('UPDATE', 'expense'), updateExpense).delete(audit('DELETE', 'expense'), deleteExpense)

export default router
