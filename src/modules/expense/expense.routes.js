import { Router } from "express";
import { getAllExpenses, getExpensesByBudget, createExpense, updateExpense, deleteExpense } from "./expense.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();
router.use(protect);
router.route("/").get(getAllExpenses).post(createExpense);
router.get("/budget/:budgetId", getExpensesByBudget);
router.route("/:id").put(updateExpense).delete(deleteExpense);

export default router;
