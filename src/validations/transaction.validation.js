import { z } from 'zod'

export const createTransactionSchema = z.object({
  type:        z.enum(['CREDIT','DEBIT']),
  amount:      z.number({ invalid_type_error: 'Amount must be a number' }).positive(),
  description: z.string().max(200).optional(),
  referenceId: z.string().max(100).optional(),
})

export const updateTransactionSchema = createTransactionSchema.partial()
