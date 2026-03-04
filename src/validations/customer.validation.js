import { z } from 'zod'

export const createCustomerSchema = z.object({
  name:    z.string().min(1, 'Name is required').max(100),
  email:   z.string().email('Invalid email address'),
  phone:   z.string().max(20).optional(),
  address: z.string().max(300).optional(),
})

export const updateCustomerSchema = createCustomerSchema.partial()
