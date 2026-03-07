import 'dotenv/config'
import path       from 'path'
import { fileURLToPath } from 'url'
import grpc       from '@grpc/grpc-js'
import protoLoader from '@grpc/proto-loader'
import prisma      from './src/config/prisma.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Load proto ───────────────────────────────────────────────────────────────
const PROTO_PATH = path.join(__dirname, 'proto', 'budget.proto')

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase:     true,
  longs:        String,
  enums:        String,
  defaults:     true,
  oneofs:       true,
})

const { budget: budgetProto } = grpc.loadPackageDefinition(packageDef)

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toBudget = (b) => ({
  id:          b.id,
  name:        b.name,
  limit:       Number(b.limit),
  spent:       Number(b.spent),
  category:    b.category    || '',
  description: b.description || '',
  created_at:  b.createdAt?.toISOString() || '',
})

const toExpense = (e) => ({
  id:          e.id,
  description: e.description,
  amount:      Number(e.amount),
  category:    e.category  || '',
  budget_id:   e.budgetId,
  created_at:  e.createdAt?.toISOString() || '',
})

// ─── Handlers ─────────────────────────────────────────────────────────────────
const getBudgets = async (call, callback) => {
  try {
    const { owner_id, category, limit = 20 } = call.request
    const budgets = await prisma.budget.findMany({
      where:   { ownerId: owner_id, ...(category && { category }) },
      take:    limit,
      orderBy: { createdAt: 'desc' },
    })
    callback(null, { budgets: budgets.map(toBudget) })
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message })
  }
}

const getBudget = async (call, callback) => {
  try {
    const { id, owner_id } = call.request
    const budget = await prisma.budget.findFirst({ where: { id, ownerId: owner_id } })
    if (!budget) return callback({ code: grpc.status.NOT_FOUND, message: 'Budget not found' })
    callback(null, toBudget(budget))
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message })
  }
}

const createBudget = async (call, callback) => {
  try {
    const { owner_id, name, limit, category = 'OTHER', description = '' } = call.request
    const budget = await prisma.budget.create({
      data: { name, limit, category, description, ownerId: owner_id },
    })
    callback(null, toBudget(budget))
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message })
  }
}

const deleteBudget = async (call, callback) => {
  try {
    const { id, owner_id } = call.request
    await prisma.budget.deleteMany({ where: { id, ownerId: owner_id } })
    callback(null, { success: true, message: `Budget ${id} deleted` })
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message })
  }
}

const addExpense = async (call, callback) => {
  try {
    const { owner_id, budget_id, description, amount, category = '' } = call.request
    const budget = await prisma.budget.findFirst({ where: { id: budget_id, ownerId: owner_id } })
    if (!budget) return callback({ code: grpc.status.NOT_FOUND, message: 'Budget not found' })

    const [expense] = await prisma.$transaction([
      prisma.expense.create({ data: { budgetId: budget_id, description, amount, category, ownerId: owner_id } }),
      prisma.budget.update({ where: { id: budget_id }, data: { spent: { increment: amount } } }),
    ])
    callback(null, toExpense(expense))
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message })
  }
}

const getExpenses = async (call, callback) => {
  try {
    const { owner_id, budget_id, limit = 20 } = call.request
    const expenses = await prisma.expense.findMany({
      where:   { ownerId: owner_id, ...(budget_id && { budgetId: budget_id }) },
      take:    limit,
      orderBy: { createdAt: 'desc' },
    })
    callback(null, { expenses: expenses.map(toExpense) })
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message })
  }
}

// ─── Start server ─────────────────────────────────────────────────────────────
const GRPC_PORT = process.env.GRPC_PORT || 50051

const server = new grpc.Server()
server.addService(budgetProto.BudgetService.service, {
  GetBudgets:   getBudgets,
  GetBudget:    getBudget,
  CreateBudget: createBudget,
  DeleteBudget: deleteBudget,
  AddExpense:   addExpense,
  GetExpenses:  getExpenses,
})

server.bindAsync(
  `0.0.0.0:${GRPC_PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) { console.error('❌ gRPC server error:', err); process.exit(1) }
    console.log(`✅ gRPC server running on port ${port}`)
    server.start()
  }
)
