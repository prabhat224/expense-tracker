const Expense = require("../models/Expense");
const Budget = require("../models/Budget");

// GET /api/expenses
const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ owner: req.user._id })
      .populate("budgetId", "name limit")
      .sort({ createdAt: -1 });
    res.status(200).json({ count: expenses.length, expenses });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch expenses.", error: error.message });
  }
};

// GET /api/expenses/budget/:budgetId
const getExpensesByBudget = async (req, res) => {
  try {
    const expenses = await Expense.find({
      budgetId: req.params.budgetId,
      owner: req.user._id,
    }).sort({ createdAt: -1 });
    res.status(200).json({ count: expenses.length, expenses });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch expenses.", error: error.message });
  }
};

// POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const { budgetId, description, amount, category, date } = req.body;
    if (!budgetId || !description || !amount) {
      return res.status(400).json({ message: "budgetId, description, and amount are required." });
    }

    // Verify budget belongs to this user
    const budget = await Budget.findOne({ _id: budgetId, owner: req.user._id });
    if (!budget) return res.status(404).json({ message: "Budget not found." });

    const expense = await Expense.create({
      budgetId, description, amount, category, date, owner: req.user._id,
    });

    // Update the budget's spent amount
    await Budget.findByIdAndUpdate(budgetId, { $inc: { spent: amount } });

    res.status(201).json({ message: "Expense added.", expense });
  } catch (error) {
    res.status(500).json({ message: "Failed to create expense.", error: error.message });
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ message: "Expense not found." });
    res.status(200).json({ message: "Expense updated.", expense });
  } catch (error) {
    res.status(500).json({ message: "Failed to update expense.", error: error.message });
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!expense) return res.status(404).json({ message: "Expense not found." });

    // Deduct from budget's spent amount
    await Budget.findByIdAndUpdate(expense.budgetId, { $inc: { spent: -expense.amount } });

    res.status(200).json({ message: "Expense deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete expense.", error: error.message });
  }
};

module.exports = { getAllExpenses, getExpensesByBudget, createExpense, updateExpense, deleteExpense };
