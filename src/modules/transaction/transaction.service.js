import prisma from "../../config/prisma.js";

export const getAll = (ownerId) =>
  prisma.transaction.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });

export const getById = (id, ownerId) =>
  prisma.transaction.findFirst({ where: { id, ownerId } });

export const create = (data, ownerId) =>
  prisma.transaction.create({ data: { ...data, ownerId } });

export const update = (id, ownerId, data) =>
  prisma.transaction.updateMany({ where: { id, ownerId }, data });

export const remove = (id, ownerId) =>
  prisma.transaction.deleteMany({ where: { id, ownerId } });
