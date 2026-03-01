import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@budget.com" },
    update: {},
    create: {
      username: "admin",
      email: "admin@budget.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const budget = await prisma.budget.create({
    data: {
      name: "Monthly Groceries",
      limit: 500.00,
      category: "FOOD",
      description: "Monthly food and grocery budget",
      ownerId: admin.id,
    },
  });

  await prisma.expense.create({
    data: {
      description: "Supermarket shopping",
      amount: 85.50,
      category: "groceries",
      budgetId: budget.id,
      ownerId: admin.id,
    },
  });

  await prisma.budget.update({
    where: { id: budget.id },
    data: { spent: 85.50 },
  });

  console.log("✅ Seeded! Login: admin@budget.com / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
