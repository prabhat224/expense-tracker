const express = require("express");
const router = express.Router();
const { getAllExpenses, getExpensesByBudget, createExpense, updateExpense, deleteExpense } = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/").get(getAllExpenses).post(createExpense);
router.get("/budget/:budgetId", getExpensesByBudget);
router.route("/:id").put(updateExpense).delete(deleteExpense);

module.exports = router;
