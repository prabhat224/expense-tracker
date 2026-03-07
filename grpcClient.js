import 'dotenv/config'
import path        from 'path'
import { fileURLToPath } from 'url'
import grpc        from '@grpc/grpc-js'
import protoLoader from '@grpc/proto-loader'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PROTO_PATH = path.join(__dirname, 'proto', 'budget.proto')

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs:    String,
  enums:    String,
  defaults: true,
  oneofs:   true,
})

const { budget: budgetProto } = grpc.loadPackageDefinition(packageDef)

const GRPC_PORT = process.env.GRPC_PORT || 50051
const client    = new budgetProto.BudgetService(
  `localhost:${GRPC_PORT}`,
  grpc.credentials.createInsecure()
)

// ─── Helper: promisify gRPC calls ─────────────────────────────────────────────
const call = (method, req) =>
  new Promise((resolve, reject) =>
    client[method](req, (err, res) => err ? reject(err) : resolve(res))
  )

// ─── Demo: run a sequence of gRPC calls ──────────────────────────────────────
const OWNER_ID = Number(process.argv[2]) || 1

const run = async () => {
  console.log('\n🔌 gRPC Client Demo')
  console.log('='.repeat(50))

  // 1. List budgets
  console.log('\n📋 GetBudgets (owner_id:', OWNER_ID, ')')
  const { budgets } = await call('GetBudgets', { owner_id: OWNER_ID, limit: 5 })
  console.log(`   → Found ${budgets.length} budget(s)`)
  budgets.forEach(b => console.log(`   • [${b.id}] ${b.name} — ₹${b.limit} (${b.category})`))

  // 2. Create a budget
  console.log('\n✨ CreateBudget')
  const created = await call('CreateBudget', {
    owner_id:    OWNER_ID,
    name:        `gRPC Budget ${Date.now()}`,
    limit:       25000,
    category:    'BUSINESS',
    description: 'Created via gRPC client',
  })
  console.log(`   → Created: [${created.id}] ${created.name}`)

  // 3. Get that budget
  console.log('\n🔍 GetBudget (id:', created.id, ')')
  const fetched = await call('GetBudget', { id: created.id, owner_id: OWNER_ID })
  console.log(`   → ${fetched.name} | Limit: ₹${fetched.limit} | Spent: ₹${fetched.spent}`)

  // 4. Add an expense to it
  console.log('\n💸 AddExpense')
  const expense = await call('AddExpense', {
    owner_id:    OWNER_ID,
    budget_id:   created.id,
    description: 'Office supplies (gRPC)',
    amount:      3500,
    category:    'office',
  })
  console.log(`   → Expense [${expense.id}]: ${expense.description} — ₹${expense.amount}`)

  // 5. Get expenses for that budget
  console.log('\n📑 GetExpenses (budget_id:', created.id, ')')
  const { expenses } = await call('GetExpenses', { owner_id: OWNER_ID, budget_id: created.id })
  console.log(`   → ${expenses.length} expense(s) in this budget`)

  // 6. Delete the budget
  console.log('\n🗑  DeleteBudget (id:', created.id, ')')
  const deleted = await call('DeleteBudget', { id: created.id, owner_id: OWNER_ID })
  console.log(`   → ${deleted.message}`)

  console.log('\n✅ gRPC demo complete!\n')
}

run().catch(err => {
  console.error('❌ gRPC client error:', err.message)
  process.exit(1)
})
