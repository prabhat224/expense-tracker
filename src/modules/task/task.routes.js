import { Router } from "express";
import { getAllTasks, getTask, createTask, updateTask, deleteTask } from "./task.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();
router.use(protect);
router.route("/").get(getAllTasks).post(createTask);
router.route("/:id").get(getTask).put(updateTask).delete(deleteTask);

export default router;
