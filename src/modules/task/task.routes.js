import { Router } from 'express'
import { getAllTasks, getTask, createTask, updateTask, deleteTask } from './task.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { createTaskSchema, updateTaskSchema } from '../../validations/task.validation.js'

const router = Router()
router.use(protect)
router.route('/').get(getAllTasks).post(validate(createTaskSchema), createTask)
router.route('/:id').get(getTask).put(validate(updateTaskSchema), updateTask).delete(deleteTask)

export default router
