import * as BudgetService from './budget.service.js'
import { successResponse, errorResponse } from '../../utils/response.js'

export const getAllBudgets = async (req, res, next) => {
  try {
    const result = await BudgetService.getAllBudgets(req.user.id, req.query)
    return successResponse(res, result)
  } catch (err) { next(err) }
}

export const getBudget = async (req, res, next) => {
  try {
    const budget = await BudgetService.getBudgetById(Number(req.params.id), req.user.id)
    if (!budget) return errorResponse(res, 'Budget not found.', 404)
    return successResponse(res, { budget })
  } catch (err) { next(err) }
}

export const createBudget = async (req, res, next) => {
  try {
    const budget = await BudgetService.createBudget(req.body, req.user.id)
    return successResponse(res, { budget }, 'Budget created.', 201)
  } catch (err) { next(err) }
}

export const updateBudget = async (req, res, next) => {
  try {
    await BudgetService.updateBudget(Number(req.params.id), req.user.id, req.body)
    const budget = await BudgetService.getBudgetById(Number(req.params.id), req.user.id)
    return successResponse(res, { budget }, 'Budget updated.')
  } catch (err) { next(err) }
}

export const deleteBudget = async (req, res, next) => {
  try {
    const result = await BudgetService.deleteBudget(Number(req.params.id), req.user.id)
    if (result.count === 0) return errorResponse(res, 'Budget not found.', 404)
    return successResponse(res, null, 'Budget deleted.')
  } catch (err) { next(err) }
}
