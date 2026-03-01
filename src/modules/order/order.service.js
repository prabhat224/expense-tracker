import prisma from "../../config/prisma.js";

export const getAll = (ownerId) =>
  prisma.order.findMany({
    where: { ownerId },
    include: { customer: { select: { name: true, email: true } }, items: true },
    orderBy: { createdAt: "desc" },
  });

export const getById = (id, ownerId) =>
  prisma.order.findFirst({
    where: { id, ownerId },
    include: { customer: { select: { name: true, email: true } }, items: true },
  });

export const create = ({ customerId, amount, status, items }, ownerId) =>
  prisma.order.create({
    data: {
      customerId, amount, status, ownerId,
      items: { create: items || [] },
    },
    include: { items: true },
  });

export const update = (id, ownerId, { status, amount }) =>
  prisma.order.updateMany({ where: { id, ownerId }, data: { status, amount } });

export const remove = (id, ownerId) =>
  prisma.order.deleteMany({ where: { id, ownerId } });
