import { Router } from 'express'
import { getAllTasks, getTask, createTask, updateTask, deleteTask } from './task.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { createTaskSchema, updateTaskSchema } from '../../validations/task.validation.js'
import { audit } from '../../middleware/audit.middleware.js'

const router = Router()
router.use(protect)
router.route('/').get(getAllTasks).post(validate(createTaskSchema), audit('CREATE', 'task'), createTask)
router.route('/:id').get(getTask).put(validate(updateTaskSchema), audit('UPDATE', 'task'), updateTask).delete(audit('DELETE', 'task'), deleteTask)

export default router
