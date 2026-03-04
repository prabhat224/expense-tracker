import { z } from 'zod'

const OrderItemSchema = z.object({
  name:     z.string().min(1),
  quantity: z.number().int().positive(),
  price:    z.number().positive(),
})

export const createOrderSchema = z.object({
  customerId: z.number().int().positive(),
  amount:     z.number().positive(),
  status:     z.enum(['PENDING','PROCESSING','COMPLETED','CANCELLED']).optional().default('PENDING'),
  items:      z.array(OrderItemSchema).optional().default([]),
})

export const updateOrderSchema = z.object({
  status: z.enum(['PENDING','PROCESSING','COMPLETED','CANCELLED']).optional(),
  amount: z.number().positive().optional(),
})
