import prisma from "../../config/prisma.js";

export const getAll = (ownerId) =>
  prisma.task.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });

export const getById = (id, ownerId) =>
  prisma.task.findFirst({ where: { id, ownerId } });

export const create = (data, ownerId) =>
  prisma.task.create({ data: { ...data, ownerId } });

export const update = (id, ownerId, data) =>
  prisma.task.updateMany({ where: { id, ownerId }, data });

export const remove = (id, ownerId) =>
  prisma.task.deleteMany({ where: { id, ownerId } });
