import { Router } from 'express'
import { protect } from '../../middleware/auth.middleware.js'
import { sendNotification } from '../../services/socketService.js'
import { publishToQueue, QUEUES } from '../../services/rabbitMQService.js'
import { publishEvent, TOPICS } from '../../services/kafkaService.js'
import { successResponse } from '../../utils/response.js'

const router = Router()

router.post('/send', protect, async (req, res, next) => {
  try {
    const { type = 'info', title, message } = req.body
    sendNotification(req.user.id, { type, title, message })
    return successResponse(res, null, 'Notification sent.')
  } catch (err) { next(err) }
})

router.post('/queue', protect, async (req, res, next) => {
  try {
    const { type, title, message } = req.body
    await publishToQueue(QUEUES.NOTIFICATIONS, {
      userId: req.user.id,
      type, title, message,
    })
    return successResponse(res, null, 'Message queued.')
  } catch (err) { next(err) }
})

router.post('/event', protect, async (req, res, next) => {
  try {
    const { topic, eventType, data } = req.body
    await publishEvent(topic || TOPICS.BUDGET_EVENTS, {
      type:   eventType,
      userId: req.user.id,
      data,
    })
    return successResponse(res, null, 'Event published to Kafka.')
  } catch (err) { next(err) }
})

export default router
