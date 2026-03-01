import * as BudgetService from "./budget.service.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getAllBudgets = async (req, res) => {
  try {
    const budgets = await BudgetService.getAllBudgets(req.user.id);
    return successResponse(res, { count: budgets.length, budgets });
  } catch (err) { return errorResponse(res, "Failed to fetch budgets.", 500, err); }
};

export const getBudget = async (req, res) => {
  try {
    const budget = await BudgetService.getBudgetById(Number(req.params.id), req.user.id);
    if (!budget) return errorResponse(res, "Budget not found.", 404);
    return successResponse(res, { budget });
  } catch (err) { return errorResponse(res, "Failed to fetch budget.", 500, err); }
};

export const createBudget = async (req, res) => {
  try {
    const { name, limit, category, description } = req.body;
    if (!name || !limit) return errorResponse(res, "Name and limit are required.", 400);
    const budget = await BudgetService.createBudget({ name, limit, category, description }, req.user.id);
    return successResponse(res, { budget }, "Budget created.", 201);
  } catch (err) { return errorResponse(res, "Failed to create budget.", 500, err); }
};

export const updateBudget = async (req, res) => {
  try {
    await BudgetService.updateBudget(Number(req.params.id), req.user.id, req.body);
    const budget = await BudgetService.getBudgetById(Number(req.params.id), req.user.id);
    return successResponse(res, { budget }, "Budget updated.");
  } catch (err) { return errorResponse(res, "Failed to update budget.", 500, err); }
};

export const deleteBudget = async (req, res) => {
  try {
    const result = await BudgetService.deleteBudget(Number(req.params.id), req.user.id);
    if (result.count === 0) return errorResponse(res, "Budget not found.", 404);
    return successResponse(res, null, "Budget deleted.");
  } catch (err) { return errorResponse(res, "Failed to delete budget.", 500, err); }
};
