import prisma from "../../config/prisma.js";

export const getUserById = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

export const updateUserById = (id, data) =>
  prisma.user.update({
    where: { id },
    data,
    select: { id: true, username: true, email: true, role: true, updatedAt: true },
  });

export const getAllUsers = () =>
  prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

export const deleteUserById = (id) =>
  prisma.user.delete({ where: { id } });
