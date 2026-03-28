import { Router } from 'express'
import { getAllCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from './customer.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { createCustomerSchema, updateCustomerSchema } from '../../validations/customer.validation.js'
import { audit } from '../../middleware/audit.middleware.js'

const router = Router()
router.use(protect)
router.route('/').get(getAllCustomers).post(validate(createCustomerSchema), audit('CREATE', 'customer'), createCustomer)
router.route('/:id').get(getCustomer).put(validate(updateCustomerSchema), audit('UPDATE', 'customer'), updateCustomer).delete(audit('DELETE', 'customer'), deleteCustomer)

export default router
