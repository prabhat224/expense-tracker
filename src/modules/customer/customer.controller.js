import * as CustomerService from './customer.service.js'
import { successResponse, errorResponse } from '../../utils/response.js'

export const getAllCustomers = async (req, res, next) => {
  try {
    const result = await CustomerService.getAll(req.user.id, req.query)
    return successResponse(res, result)
  } catch (err) { next(err) }
}

export const getCustomer = async (req, res, next) => {
  try {
    const customer = await CustomerService.getById(Number(req.params.id), req.user.id)
    if (!customer) return errorResponse(res, 'Customer not found.', 404)
    return successResponse(res, { customer })
  } catch (err) { next(err) }
}

export const createCustomer = async (req, res, next) => {
  try {
    const customer = await CustomerService.create(req.body, req.user.id)
    return successResponse(res, { customer }, 'Customer created.', 201)
  } catch (err) { next(err) }
}

export const updateCustomer = async (req, res, next) => {
  try {
    await CustomerService.update(Number(req.params.id), req.user.id, req.body)
    return successResponse(res, null, 'Customer updated.')
  } catch (err) { next(err) }
}

export const deleteCustomer = async (req, res, next) => {
  try {
    const result = await CustomerService.remove(Number(req.params.id), req.user.id)
    if (result.count === 0) return errorResponse(res, 'Customer not found.', 404)
    return successResponse(res, null, 'Customer deleted.')
  } catch (err) { next(err) }
}
