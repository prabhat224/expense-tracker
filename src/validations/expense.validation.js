import { z } from 'zod'

export const createExpenseSchema = z.object({
  budgetId:    z.number({ invalid_type_error: 'budgetId must be a number' }).int().positive(),
  description: z.string().min(1, 'Description is required').max(200),
  amount:      z.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be positive'),
  category:    z.string().max(50).optional(),
  date:        z.string().optional(),
})

export const updateExpenseSchema = createExpenseSchema.partial()
