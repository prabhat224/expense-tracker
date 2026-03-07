import {
  GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLFloat,
  GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLEnumType
} from 'graphql'
import prisma from '../src/config/prisma.js'

// ─── Types ─────────────────────────────────────────────────────────────────

const BudgetCategoryEnum = new GraphQLEnumType({
  name: 'BudgetCategory',
  values: {
    PERSONAL: { value: 'PERSONAL' },
    BUSINESS: { value: 'BUSINESS' },
    TRAVEL:   { value: 'TRAVEL'   },
    FOOD:     { value: 'FOOD'     },
    HEALTH:   { value: 'HEALTH'   },
    OTHER:    { value: 'OTHER'    },
  },
})

const BudgetType = new GraphQLObjectType({
  name: 'Budget',
  fields: () => ({
    id:          { type: GraphQLInt    },
    name:        { type: GraphQLString },
    limit:       { type: GraphQLFloat  },
    spent:       { type: GraphQLFloat  },
    category:    { type: GraphQLString },
    description: { type: GraphQLString },
    createdAt:   { type: GraphQLString, resolve: (b) => b.createdAt?.toISOString() },
    expenses: {
      type: new GraphQLList(ExpenseType),
      resolve: (budget) =>
        prisma.expense.findMany({ where: { budgetId: budget.id }, orderBy: { createdAt: 'desc' } }),
    },
  }),
})

const ExpenseType = new GraphQLObjectType({
  name: 'Expense',
  fields: () => ({
    id:          { type: GraphQLInt    },
    description: { type: GraphQLString },
    amount:      { type: GraphQLFloat  },
    category:    { type: GraphQLString },
    createdAt:   { type: GraphQLString, resolve: (e) => e.createdAt?.toISOString() },
    budget: {
      type: BudgetType,
      resolve: (expense) => prisma.budget.findUnique({ where: { id: expense.budgetId } }),
    },
  }),
})

// ─── Query ──────────────────────────────────────────────────────────────────

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    budgets: {
      type: new GraphQLList(BudgetType),
      args: {
        category: { type: GraphQLString },
        limit:    { type: GraphQLInt    },
      },
      resolve: async (_, { category, limit = 20 }, context) => {
        if (!context.userId) throw new Error('Unauthorized')
        return prisma.budget.findMany({
          where:   { ownerId: context.userId, ...(category && { category }) },
          take:    limit,
          orderBy: { createdAt: 'desc' },
        })
      },
    },

    expenses: {
      type: new GraphQLList(ExpenseType),
      args: {
        budgetId: { type: GraphQLInt    },
        limit:    { type: GraphQLInt    },
        search:   { type: GraphQLString },
      },
      resolve: async (_, { budgetId, limit = 20, search }, context) => {
        if (!context.userId) throw new Error('Unauthorized')
        return prisma.expense.findMany({
          where: {
            ownerId: context.userId,
            ...(budgetId && { budgetId }),
            ...(search   && { description: { contains: search } }),
          },
          take:    limit,
          orderBy: { createdAt: 'desc' },
        })
      },
    },

    budget: {
      type: BudgetType,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: async (_, { id }, context) => {
        if (!context.userId) throw new Error('Unauthorized')
        return prisma.budget.findFirst({ where: { id, ownerId: context.userId } })
      },
    },
  },
})

// ─── Mutation ───────────────────────────────────────────────────────────────

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createBudget: {
      type: BudgetType,
      args: {
        name:        { type: new GraphQLNonNull(GraphQLString) },
        limit:       { type: new GraphQLNonNull(GraphQLFloat)  },
        category:    { type: GraphQLString },
        description: { type: GraphQLString },
      },
      resolve: async (_, { name, limit, category = 'OTHER', description }, context) => {
        if (!context.userId) throw new Error('Unauthorized')
        return prisma.budget.create({
          data: { name, limit, category, description, ownerId: context.userId },
        })
      },
    },

    addExpense: {
      type: ExpenseType,
      args: {
        budgetId:    { type: new GraphQLNonNull(GraphQLInt)    },
        description: { type: new GraphQLNonNull(GraphQLString) },
        amount:      { type: new GraphQLNonNull(GraphQLFloat)  },
        category:    { type: GraphQLString },
      },
      resolve: async (_, { budgetId, description, amount, category }, context) => {
        if (!context.userId) throw new Error('Unauthorized')

        const budget = await prisma.budget.findFirst({ where: { id: budgetId, ownerId: context.userId } })
        if (!budget) throw new Error('Budget not found')

        const [expense] = await prisma.$transaction([
          prisma.expense.create({ data: { budgetId, description, amount, category, ownerId: context.userId } }),
          prisma.budget.update({ where: { id: budgetId }, data: { spent: { increment: amount } } }),
        ])

        return expense
      },
    },

    deleteBudget: {
      type: GraphQLString,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: async (_, { id }, context) => {
        if (!context.userId) throw new Error('Unauthorized')
        await prisma.budget.deleteMany({ where: { id, ownerId: context.userId } })
        return `Budget ${id} deleted`
      },
    },
  },
})

// ─── Export schema ───────────────────────────────────────────────────────────

export default new GraphQLSchema({
  query:    QueryType,
  mutation: MutationType,
})
