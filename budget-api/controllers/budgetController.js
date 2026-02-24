const Budget = require("../models/Budget");

// GET /api/budgets
const getAllBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ count: budgets.length, budgets });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch budgets.", error: error.message });
  }
};

// GET /api/budgets/:id
const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, owner: req.user._id });
    if (!budget) return res.status(404).json({ message: "Budget not found." });
    res.status(200).json({ budget });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch budget.", error: error.message });
  }
};

// POST /api/budgets
const createBudget = async (req, res) => {
  try {
    const { name, limit, category, description } = req.body;
    if (!name || !limit) {
      return res.status(400).json({ message: "Name and limit are required." });
    }
    const budget = await Budget.create({ name, limit, category, description, owner: req.user._id });
    res.status(201).json({ message: "Budget created.", budget });
  } catch (error) {
    res.status(500).json({ message: "Failed to create budget.", error: error.message });
  }
};

// PUT /api/budgets/:id
const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ message: "Budget not found." });
    res.status(200).json({ message: "Budget updated.", budget });
  } catch (error) {
    res.status(500).json({ message: "Failed to update budget.", error: error.message });
  }
};

// DELETE /api/budgets/:id
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!budget) return res.status(404).json({ message: "Budget not found." });
    res.status(200).json({ message: "Budget deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete budget.", error: error.message });
  }
};

module.exports = { getAllBudgets, getBudget, createBudget, updateBudget, deleteBudget };
