import * as TaskService from "./task.service.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getAllTasks = async (req, res) => {
  try {
    const tasks = await TaskService.getAll(req.user.id);
    return successResponse(res, { count: tasks.length, tasks });
  } catch (err) { return errorResponse(res, "Failed to fetch tasks.", 500, err); }
};

export const getTask = async (req, res) => {
  try {
    const task = await TaskService.getById(Number(req.params.id), req.user.id);
    if (!task) return errorResponse(res, "Task not found.", 404);
    return successResponse(res, { task });
  } catch (err) { return errorResponse(res, "Failed to fetch task.", 500, err); }
};

export const createTask = async (req, res) => {
  try {
    const { description, priority, dueDate } = req.body;
    if (!description) return errorResponse(res, "Description is required.", 400);
    const task = await TaskService.create({ description, priority, dueDate }, req.user.id);
    return successResponse(res, { task }, "Task created.", 201);
  } catch (err) { return errorResponse(res, "Failed to create task.", 500, err); }
};

export const updateTask = async (req, res) => {
  try {
    await TaskService.update(Number(req.params.id), req.user.id, req.body);
    return successResponse(res, null, "Task updated.");
  } catch (err) { return errorResponse(res, "Failed to update task.", 500, err); }
};

export const deleteTask = async (req, res) => {
  try {
    const result = await TaskService.remove(Number(req.params.id), req.user.id);
    if (result.count === 0) return errorResponse(res, "Task not found.", 404);
    return successResponse(res, null, "Task deleted.");
  } catch (err) { return errorResponse(res, "Failed to delete task.", 500, err); }
};
