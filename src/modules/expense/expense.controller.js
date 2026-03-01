import * as ExpenseService from "./expense.service.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await ExpenseService.getAllExpenses(req.user.id);
    return successResponse(res, { count: expenses.length, expenses });
  } catch (err) { return errorResponse(res, "Failed to fetch expenses.", 500, err); }
};

export const getExpensesByBudget = async (req, res) => {
  try {
    const expenses = await ExpenseService.getExpensesByBudget(Number(req.params.budgetId), req.user.id);
    return successResponse(res, { count: expenses.length, expenses });
  } catch (err) { return errorResponse(res, "Failed to fetch expenses.", 500, err); }
};

export const createExpense = async (req, res) => {
  try {
    const { budgetId, description, amount, category, date } = req.body;
    if (!budgetId || !description || !amount)
      return errorResponse(res, "budgetId, description, and amount are required.", 400);
    const expense = await ExpenseService.createExpense(
      { budgetId: Number(budgetId), description, amount, category, date },
      req.user.id
    );
    return successResponse(res, { expense }, "Expense created.", 201);
  } catch (err) { return errorResponse(res, err.message, err.status || 500, err); }
};

export const updateExpense = async (req, res) => {
  try {
    await ExpenseService.updateExpense(Number(req.params.id), req.user.id, req.body);
    return successResponse(res, null, "Expense updated.");
  } catch (err) { return errorResponse(res, "Failed to update expense.", 500, err); }
};

export const deleteExpense = async (req, res) => {
  try {
    await ExpenseService.deleteExpense(Number(req.params.id), req.user.id);
    return successResponse(res, null, "Expense deleted.");
  } catch (err) { return errorResponse(res, err.message, err.status || 500, err); }
};
