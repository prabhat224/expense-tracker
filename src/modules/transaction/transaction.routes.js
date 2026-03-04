import { Router } from 'express'
import { getAllTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction } from './transaction.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { createTransactionSchema, updateTransactionSchema } from '../../validations/transaction.validation.js'

const router = Router()
router.use(protect)
router.route('/').get(getAllTransactions).post(validate(createTransactionSchema), createTransaction)
router.route('/:id').get(getTransaction).put(validate(updateTransactionSchema), updateTransaction).delete(deleteTransaction)

export default router
