import { Router } from 'express'
import { getAllTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction } from './transaction.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { createTransactionSchema, updateTransactionSchema } from '../../validations/transaction.validation.js'
import { audit } from '../../middleware/audit.middleware.js'

const router = Router()
router.use(protect)
router.route('/').get(getAllTransactions).post(validate(createTransactionSchema), audit('CREATE', 'transaction'), createTransaction)
router.route('/:id').get(getTransaction).put(validate(updateTransactionSchema), audit('UPDATE', 'transaction'), updateTransaction).delete(audit('DELETE', 'transaction'), deleteTransaction)

export default router
