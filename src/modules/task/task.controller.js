import * as TaskService from './task.service.js'
import { successResponse, errorResponse } from '../../utils/response.js'

export const getAllTasks = async (req, res, next) => {
  try {
    const result = await TaskService.getAll(req.user.id, req.query)
    return successResponse(res, result)
  } catch (err) { next(err) }
}

export const getTask = async (req, res, next) => {
  try {
    const task = await TaskService.getById(Number(req.params.id), req.user.id)
    if (!task) return errorResponse(res, 'Task not found.', 404)
    return successResponse(res, { task })
  } catch (err) { next(err) }
}

export const createTask = async (req, res, next) => {
  try {
    const task = await TaskService.create(req.body, req.user.id)
    return successResponse(res, { task }, 'Task created.', 201)
  } catch (err) { next(err) }
}

export const updateTask = async (req, res, next) => {
  try {
    await TaskService.update(Number(req.params.id), req.user.id, req.body)
    return successResponse(res, null, 'Task updated.')
  } catch (err) { next(err) }
}

export const deleteTask = async (req, res, next) => {
  try {
    const result = await TaskService.remove(Number(req.params.id), req.user.id)
    if (result.count === 0) return errorResponse(res, 'Task not found.', 404)
    return successResponse(res, null, 'Task deleted.')
  } catch (err) { next(err) }
}
