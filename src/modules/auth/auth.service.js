import bcrypt from "bcryptjs";
import prisma from "../../config/prisma.js";
import { generateToken } from "../../utils/jwt.js";

export const registerUser = async ({ username, email, password }) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) throw { status: 409, message: "Email or username already exists." };

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
    select: { id: true, username: true, email: true, role: true, createdAt: true },
  });

  const token = generateToken(user.id);
  return { token, user };
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { status: 401, message: "Invalid email or password." };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw { status: 401, message: "Invalid email or password." };

  const token = generateToken(user.id);
  const { password: _, ...safeUser } = user;
  return { token, user: safeUser };
};
