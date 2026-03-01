import { Router } from "express";
import authRoutes        from "./modules/auth/auth.routes.js";
import userRoutes        from "./modules/user/user.routes.js";
import budgetRoutes      from "./modules/budget/budget.routes.js";
import expenseRoutes     from "./modules/expense/expense.routes.js";
import customerRoutes    from "./modules/customer/customer.routes.js";
import orderRoutes       from "./modules/order/order.routes.js";
import taskRoutes        from "./modules/task/task.routes.js";
import transactionRoutes from "./modules/transaction/transaction.routes.js";

const router = Router();

router.use("/auth",         authRoutes);
router.use("/users",        userRoutes);
router.use("/budgets",      budgetRoutes);
router.use("/expenses",     expenseRoutes);
router.use("/customers",    customerRoutes);
router.use("/orders",       orderRoutes);
router.use("/tasks",        taskRoutes);
router.use("/transactions", transactionRoutes);

export default router;
