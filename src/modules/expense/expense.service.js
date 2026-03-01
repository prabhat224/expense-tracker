import prisma from "../../config/prisma.js";

export const getAllExpenses = (ownerId) =>
  prisma.expense.findMany({
    where: { ownerId },
    include: { budget: { select: { name: true, limit: true } } },
    orderBy: { createdAt: "desc" },
  });

export const getExpensesByBudget = (budgetId, ownerId) =>
  prisma.expense.findMany({ where: { budgetId, ownerId }, orderBy: { createdAt: "desc" } });

export const createExpense = async ({ budgetId, description, amount, category, date }, ownerId) => {
  const budget = await prisma.budget.findFirst({ where: { id: budgetId, ownerId } });
  if (!budget) throw { status: 404, message: "Budget not found." };

  const [expense] = await prisma.$transaction([
    prisma.expense.create({
      data: { budgetId, description, amount, category, date, ownerId },
    }),
    prisma.budget.update({
      where: { id: budgetId },
      data: { spent: { increment: amount } },
    }),
  ]);
  return expense;
};

export const updateExpense = (id, ownerId, data) =>
  prisma.expense.updateMany({ where: { id, ownerId }, data });

export const deleteExpense = async (id, ownerId) => {
  const expense = await prisma.expense.findFirst({ where: { id, ownerId } });
  if (!expense) throw { status: 404, message: "Expense not found." };

  await prisma.$transaction([
    prisma.expense.delete({ where: { id } }),
    prisma.budget.update({
      where: { id: expense.budgetId },
      data: { spent: { decrement: expense.amount } },
    }),
  ]);
  return expense;
};
