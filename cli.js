#!/usr/bin/env node
import 'dotenv/config'
import { program } from 'commander'
import prisma       from './src/config/prisma.js'

program
  .name('budgetco')
  .description('BudgetCo CLI — manage your finance API from the terminal')
  .version('2.0.0')

// ─── seed ─────────────────────────────────────────────────────────────────────
program
  .command('seed')
  .description('Seed the database with demo data')
  .option('--user-id <id>', 'Owner user ID to seed data for', '1')
  .action(async (opts) => {
    const ownerId = Number(opts.userId)
    console.log(`\n🌱 Seeding database for user ${ownerId}...\n`)

    // Seed budgets
    const budgets = await Promise.all([
      prisma.budget.create({ data: { name: 'Monthly Groceries',  limit: 15000, category: 'FOOD',     ownerId, spent: 4200  } }),
      prisma.budget.create({ data: { name: 'Business Travel',    limit: 50000, category: 'TRAVEL',   ownerId, spent: 12000 } }),
      prisma.budget.create({ data: { name: 'Health & Wellness',  limit: 10000, category: 'HEALTH',   ownerId, spent: 3800  } }),
      prisma.budget.create({ data: { name: 'Office Expenses',    limit: 25000, category: 'BUSINESS', ownerId, spent: 8500  } }),
    ])
    console.log(`  ✅ ${budgets.length} budgets created`)

    // Seed expenses
    const expenses = await Promise.all([
      prisma.expense.create({ data: { budgetId: budgets[0].id, description: 'Weekly groceries',   amount: 2100, ownerId } }),
      prisma.expense.create({ data: { budgetId: budgets[0].id, description: 'Fruits & vegetables', amount: 1200, ownerId } }),
      prisma.expense.create({ data: { budgetId: budgets[1].id, description: 'Flight to Mumbai',    amount: 8500, ownerId } }),
      prisma.expense.create({ data: { budgetId: budgets[1].id, description: 'Hotel 3 nights',      amount: 4500, ownerId } }),
      prisma.expense.create({ data: { budgetId: budgets[2].id, description: 'Gym membership',      amount: 3800, ownerId } }),
      prisma.expense.create({ data: { budgetId: budgets[3].id, description: 'Office supplies',     amount: 3200, ownerId } }),
      prisma.expense.create({ data: { budgetId: budgets[3].id, description: 'Software license',    amount: 5300, ownerId } }),
    ])
    console.log(`  ✅ ${expenses.length} expenses created`)

    // Seed tasks
    const tasks = await Promise.all([
      prisma.task.create({ data: { description: 'Review Q1 budget report',     priority: 'HIGH',   status: 'PENDING',     ownerId } }),
      prisma.task.create({ data: { description: 'Approve travel reimbursements', priority: 'MEDIUM', status: 'IN_PROGRESS', ownerId } }),
      prisma.task.create({ data: { description: 'Set up Grafana dashboard',     priority: 'HIGH',   status: 'PENDING',     ownerId } }),
      prisma.task.create({ data: { description: 'Send monthly expense report',  priority: 'LOW',    status: 'COMPLETED',   ownerId } }),
    ])
    console.log(`  ✅ ${tasks.length} tasks created`)

    // Seed customers
    const customers = await Promise.all([
      prisma.customer.create({ data: { name: 'Riya Sharma',    email: 'riya@example.com',   phone: '+91 9876543210', ownerId } }),
      prisma.customer.create({ data: { name: 'Arjun Mehta',   email: 'arjun@example.com',  phone: '+91 9876543211', ownerId } }),
      prisma.customer.create({ data: { name: 'Priya Kapoor',  email: 'priya@example.com',  phone: '+91 9876543212', ownerId } }),
    ])
    console.log(`  ✅ ${customers.length} customers created`)

    // Seed transactions
    const transactions = await Promise.all([
      prisma.transaction.create({ data: { type: 'CREDIT', amount: 75000, description: 'Client payment Q1',    ownerId } }),
      prisma.transaction.create({ data: { type: 'CREDIT', amount: 45000, description: 'Consulting invoice',   ownerId } }),
      prisma.transaction.create({ data: { type: 'DEBIT',  amount: 15000, description: 'Vendor payment March', ownerId } }),
    ])
    console.log(`  ✅ ${transactions.length} transactions created`)

    console.log('\n🎉 Seed complete! Your database is populated.\n')
    process.exit(0)
  })

// ─── list-budgets ─────────────────────────────────────────────────────────────
program
  .command('list-budgets')
  .description('List all budgets for a user')
  .option('--user-id <id>', 'User ID', '1')
  .option('--category <cat>', 'Filter by category')
  .action(async (opts) => {
    const ownerId = Number(opts.userId)
    const budgets = await prisma.budget.findMany({
      where:   { ownerId, ...(opts.category && { category: opts.category }) },
      orderBy: { createdAt: 'desc' },
    })

    if (!budgets.length) {
      console.log('\n  📭 No budgets found.\n')
      process.exit(0)
    }

    console.log(`\n📊 Budgets for user ${ownerId} (${budgets.length} total)\n`)
    console.log('  ' + '─'.repeat(72))
    console.log(`  ${'ID'.padEnd(6)} ${'Name'.padEnd(24)} ${'Category'.padEnd(12)} ${'Limit'.padEnd(12)} ${'Spent'.padEnd(12)} Health`)
    console.log('  ' + '─'.repeat(72))

    budgets.forEach(b => {
      const pct    = ((Number(b.spent) / Number(b.limit)) * 100).toFixed(0)
      const health = pct >= 90 ? '🔴 Critical' : pct >= 70 ? '🟡 Warning' : '🟢 Healthy'
      const fmt    = (n) => `₹${Number(n).toLocaleString('en-IN')}`
      console.log(`  ${String(b.id).padEnd(6)} ${b.name.slice(0,23).padEnd(24)} ${b.category.padEnd(12)} ${fmt(b.limit).padEnd(12)} ${fmt(b.spent).padEnd(12)} ${health} (${pct}%)`)
    })
    console.log('  ' + '─'.repeat(72) + '\n')
    process.exit(0)
  })

// ─── add-task ─────────────────────────────────────────────────────────────────
program
  .command('add-task')
  .description('Add a task')
  .requiredOption('--desc <description>', 'Task description')
  .option('--priority <level>', 'LOW | MEDIUM | HIGH', 'MEDIUM')
  .option('--user-id <id>', 'User ID', '1')
  .action(async (opts) => {
    const task = await prisma.task.create({
      data: {
        description: opts.desc,
        priority:    opts.priority.toUpperCase(),
        ownerId:     Number(opts.userId),
      },
    })
    console.log(`\n✅ Task created [${task.id}]: "${task.description}" (${task.priority})\n`)
    process.exit(0)
  })

// ─── notify ───────────────────────────────────────────────────────────────────
program
  .command('notify')
  .description('Send a notification to a user via the API')
  .requiredOption('--user-id <id>', 'Target user ID')
  .option('--title <title>', 'Notification title', 'CLI Notification')
  .option('--message <msg>', 'Notification message', 'Hello from the CLI!')
  .option('--type <type>', 'info | success | warning | error', 'info')
  .option('--token <token>', 'JWT access token (or set CLI_TOKEN env var)')
  .action(async (opts) => {
    const token = opts.token || process.env.CLI_TOKEN
    if (!token) {
      console.error('\n❌ --token or CLI_TOKEN env var required\n')
      process.exit(1)
    }

    const port = process.env.PORT || 3000
    const res  = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ type: opts.type, title: opts.title, message: opts.message }),
    })
    const data = await res.json()
    if (res.ok) {
      console.log(`\n🔔 Notification sent to user ${opts.userId}`)
      console.log(`   Type: ${opts.type} | Title: ${opts.title}`)
      console.log(`   Message: ${opts.message}\n`)
    } else {
      console.error('\n❌ Error:', data.message)
    }
    process.exit(0)
  })

// ─── stats ────────────────────────────────────────────────────────────────────
program
  .command('stats')
  .description('Show database statistics')
  .action(async () => {
    const [budgets, expenses, customers, orders, tasks, transactions, users] =
      await Promise.all([
        prisma.budget.count(),
        prisma.expense.count(),
        prisma.customer.count(),
        prisma.order.count(),
        prisma.task.count(),
        prisma.transaction.count(),
        prisma.user.count(),
      ])

    console.log('\n📈 BudgetCo Database Stats\n')
    console.log(`  👤 Users:        ${users}`)
    console.log(`  💼 Budgets:      ${budgets}`)
    console.log(`  🧾 Expenses:     ${expenses}`)
    console.log(`  👥 Customers:    ${customers}`)
    console.log(`  📦 Orders:       ${orders}`)
    console.log(`  ✅ Tasks:        ${tasks}`)
    console.log(`  💰 Transactions: ${transactions}`)
    console.log()
    process.exit(0)
  })

program.parse()
