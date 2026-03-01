import prisma from "../../config/prisma.js";

export const getAllBudgets = (ownerId) =>
  prisma.budget.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });

export const getBudgetById = (id, ownerId) =>
  prisma.budget.findFirst({ where: { id, ownerId } });

export const createBudget = (data, ownerId) =>
  prisma.budget.create({ data: { ...data, ownerId } });

export const updateBudget = (id, ownerId, data) =>
  prisma.budget.updateMany({ where: { id, ownerId }, data });

export const deleteBudget = (id, ownerId) =>
  prisma.budget.deleteMany({ where: { id, ownerId } });
