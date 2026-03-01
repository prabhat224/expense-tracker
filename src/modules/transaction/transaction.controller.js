import * as TxnService from "./transaction.service.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await TxnService.getAll(req.user.id);
    return successResponse(res, { count: transactions.length, transactions });
  } catch (err) { return errorResponse(res, "Failed to fetch transactions.", 500, err); }
};

export const getTransaction = async (req, res) => {
  try {
    const transaction = await TxnService.getById(Number(req.params.id), req.user.id);
    if (!transaction) return errorResponse(res, "Transaction not found.", 404);
    return successResponse(res, { transaction });
  } catch (err) { return errorResponse(res, "Failed to fetch transaction.", 500, err); }
};

export const createTransaction = async (req, res) => {
  try {
    const { type, amount, description, referenceId } = req.body;
    if (!type || !amount) return errorResponse(res, "Type and amount are required.", 400);
    const transaction = await TxnService.create({ type, amount, description, referenceId }, req.user.id);
    return successResponse(res, { transaction }, "Transaction recorded.", 201);
  } catch (err) { return errorResponse(res, "Failed to create transaction.", 500, err); }
};

export const updateTransaction = async (req, res) => {
  try {
    await TxnService.update(Number(req.params.id), req.user.id, req.body);
    return successResponse(res, null, "Transaction updated.");
  } catch (err) { return errorResponse(res, "Failed to update transaction.", 500, err); }
};

export const deleteTransaction = async (req, res) => {
  try {
    const result = await TxnService.remove(Number(req.params.id), req.user.id);
    if (result.count === 0) return errorResponse(res, "Transaction not found.", 404);
    return successResponse(res, null, "Transaction deleted.");
  } catch (err) { return errorResponse(res, "Failed to delete transaction.", 500, err); }
};
