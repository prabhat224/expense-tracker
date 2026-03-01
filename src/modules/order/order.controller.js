import * as OrderService from "./order.service.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getAllOrders = async (req, res) => {
  try {
    const orders = await OrderService.getAll(req.user.id);
    return successResponse(res, { count: orders.length, orders });
  } catch (err) { return errorResponse(res, "Failed to fetch orders.", 500, err); }
};

export const getOrder = async (req, res) => {
  try {
    const order = await OrderService.getById(Number(req.params.id), req.user.id);
    if (!order) return errorResponse(res, "Order not found.", 404);
    return successResponse(res, { order });
  } catch (err) { return errorResponse(res, "Failed to fetch order.", 500, err); }
};

export const createOrder = async (req, res) => {
  try {
    const { customerId, amount, status, items } = req.body;
    if (!customerId || !amount) return errorResponse(res, "customerId and amount are required.", 400);
    const order = await OrderService.create(
      { customerId: Number(customerId), amount, status, items },
      req.user.id
    );
    return successResponse(res, { order }, "Order created.", 201);
  } catch (err) { return errorResponse(res, "Failed to create order.", 500, err); }
};

export const updateOrder = async (req, res) => {
  try {
    await OrderService.update(Number(req.params.id), req.user.id, req.body);
    return successResponse(res, null, "Order updated.");
  } catch (err) { return errorResponse(res, "Failed to update order.", 500, err); }
};

export const deleteOrder = async (req, res) => {
  try {
    const result = await OrderService.remove(Number(req.params.id), req.user.id);
    if (result.count === 0) return errorResponse(res, "Order not found.", 404);
    return successResponse(res, null, "Order deleted.");
  } catch (err) { return errorResponse(res, "Failed to delete order.", 500, err); }
};
