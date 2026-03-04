import * as ExpenseService from './expense.service.js'
import { successResponse, errorResponse } from '../../utils/response.js'

export const getAllExpenses = async (req, res, next) => {
  try {
    const result = await ExpenseService.getAllExpenses(req.user.id, req.query)
    return successResponse(res, result)
  } catch (err) { next(err) }
}

export const getExpensesByBudget = async (req, res, next) => {
  try {
    const expenses = await ExpenseService.getExpensesByBudget(Number(req.params.budgetId), req.user.id)
    return successResponse(res, { count: expenses.length, expenses })
  } catch (err) { next(err) }
}

export const createExpense = async (req, res, next) => {
  try {
    const expense = await ExpenseService.createExpense(req.body, req.user.id)
    return successResponse(res, { expense }, 'Expense created.', 201)
  } catch (err) { next(err) }
}

export const updateExpense = async (req, res, next) => {
  try {
    await ExpenseService.updateExpense(Number(req.params.id), req.user.id, req.body)
    return successResponse(res, null, 'Expense updated.')
  } catch (err) { next(err) }
}

export const deleteExpense = async (req, res, next) => {
  try {
    await ExpenseService.deleteExpense(Number(req.params.id), req.user.id)
    return successResponse(res, null, 'Expense deleted.')
  } catch (err) { next(err) }
}
