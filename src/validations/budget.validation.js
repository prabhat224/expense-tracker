import { z } from 'zod'

export const createBudgetSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(100),
  limit:       z.number({ invalid_type_error: 'Limit must be a number' }).positive('Limit must be positive'),
  category:    z.enum(['PERSONAL','BUSINESS','TRAVEL','FOOD','HEALTH','OTHER']).optional().default('OTHER'),
  description: z.string().max(500).optional(),
})

export const updateBudgetSchema = createBudgetSchema.partial()
