import * as CustomerService from "./customer.service.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await CustomerService.getAll(req.user.id);
    return successResponse(res, { count: customers.length, customers });
  } catch (err) { return errorResponse(res, "Failed to fetch customers.", 500, err); }
};

export const getCustomer = async (req, res) => {
  try {
    const customer = await CustomerService.getById(Number(req.params.id), req.user.id);
    if (!customer) return errorResponse(res, "Customer not found.", 404);
    return successResponse(res, { customer });
  } catch (err) { return errorResponse(res, "Failed to fetch customer.", 500, err); }
};

export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !email) return errorResponse(res, "Name and email are required.", 400);
    const customer = await CustomerService.create({ name, email, phone, address }, req.user.id);
    return successResponse(res, { customer }, "Customer created.", 201);
  } catch (err) {
    if (err.code === "P2002") return errorResponse(res, "Customer with that email already exists.", 409);
    return errorResponse(res, "Failed to create customer.", 500, err);
  }
};

export const updateCustomer = async (req, res) => {
  try {
    await CustomerService.update(Number(req.params.id), req.user.id, req.body);
    return successResponse(res, null, "Customer updated.");
  } catch (err) { return errorResponse(res, "Failed to update customer.", 500, err); }
};

export const deleteCustomer = async (req, res) => {
  try {
    const result = await CustomerService.remove(Number(req.params.id), req.user.id);
    if (result.count === 0) return errorResponse(res, "Customer not found.", 404);
    return successResponse(res, null, "Customer deleted.");
  } catch (err) { return errorResponse(res, "Failed to delete customer.", 500, err); }
};
