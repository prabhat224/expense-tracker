import { Router } from 'express'
import { getAllCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from './customer.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { createCustomerSchema, updateCustomerSchema } from '../../validations/customer.validation.js'

const router = Router()
router.use(protect)
router.route('/').get(getAllCustomers).post(validate(createCustomerSchema), createCustomer)
router.route('/:id').get(getCustomer).put(validate(updateCustomerSchema), updateCustomer).delete(deleteCustomer)

export default router
