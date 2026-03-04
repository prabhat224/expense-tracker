import { Router } from 'express'
import { getAllExpenses, getExpensesByBudget, createExpense, updateExpense, deleteExpense } from './expense.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { createExpenseSchema, updateExpenseSchema } from '../../validations/expense.validation.js'

const router = Router()
router.use(protect)
router.route('/').get(getAllExpenses).post(validate(createExpenseSchema), createExpense)
router.get('/budget/:budgetId', getExpensesByBudget)
router.route('/:id').put(validate(updateExpenseSchema), updateExpense).delete(deleteExpense)

export default router
