import { z } from 'zod'

export const createTaskSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  priority:    z.enum(['LOW','MEDIUM','HIGH']).optional().default('MEDIUM'),
  status:      z.enum(['PENDING','IN_PROGRESS','COMPLETED','FAILED']).optional().default('PENDING'),
  dueDate:     z.string().optional(),
})

export const updateTaskSchema = createTaskSchema.partial()
