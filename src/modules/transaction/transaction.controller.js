import * as TxnService from './transaction.service.js'
import { successResponse, errorResponse } from '../../utils/response.js'

export const getAllTransactions = async (req, res, next) => {
  try {
    const result = await TxnService.getAll(req.user.id, req.query)
    return successResponse(res, result)
  } catch (err) { next(err) }
}

export const getTransaction = async (req, res, next) => {
  try {
    const transaction = await TxnService.getById(Number(req.params.id), req.user.id)
    if (!transaction) return errorResponse(res, 'Transaction not found.', 404)
    return successResponse(res, { transaction })
  } catch (err) { next(err) }
}

export const createTransaction = async (req, res, next) => {
  try {
    const transaction = await TxnService.create(req.body, req.user.id)
    return successResponse(res, { transaction }, 'Transaction recorded.', 201)
  } catch (err) { next(err) }
}

export const updateTransaction = async (req, res, next) => {
  try {
    await TxnService.update(Number(req.params.id), req.user.id, req.body)
    return successResponse(res, null, 'Transaction updated.')
  } catch (err) { next(err) }
}

export const deleteTransaction = async (req, res, next) => {
  try {
    const result = await TxnService.remove(Number(req.params.id), req.user.id)
    if (result.count === 0) return errorResponse(res, 'Transaction not found.', 404)
    return successResponse(res, null, 'Transaction deleted.')
  } catch (err) { next(err) }
}
