import prisma from "../../config/prisma.js";

export const getAll = (ownerId) =>
  prisma.customer.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });

export const getById = (id, ownerId) =>
  prisma.customer.findFirst({ where: { id, ownerId } });

export const create = (data, ownerId) =>
  prisma.customer.create({ data: { ...data, ownerId } });

export const update = (id, ownerId, data) =>
  prisma.customer.updateMany({ where: { id, ownerId }, data });

export const remove = (id, ownerId) =>
  prisma.customer.deleteMany({ where: { id, ownerId } });
