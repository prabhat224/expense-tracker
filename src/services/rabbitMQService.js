import amqplib from 'amqplib'
import logger from '../utils/logger.js'

let connection
let channel

const QUEUES = {
  NOTIFICATIONS: 'notifications',
  EMAIL:         'email_queue',
  REPORTS:       'reports',
}

// ── Connect and setup queues ──────────────────────────────
export const initRabbitMQ = async () => {
  try {
    connection = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672')
    channel    = await connection.createChannel()

    // Declare all queues — durable:true means queue survives RabbitMQ restart
    for (const queue of Object.values(QUEUES)) {
      await channel.assertQueue(queue, { durable: true })
    }

    // Start consuming the notification queue
    await consumeNotifications()

    logger.info('✅ RabbitMQ connected and queues ready')

    connection.on('error', (err) => {
      logger.error('❌ RabbitMQ connection error', { error: err.message })
    })
  } catch (err) {
    logger.error('❌ RabbitMQ init failed', { error: err.message })
    // Don't crash — RabbitMQ is not critical path
  }
}

// ── Publish a message to a queue ─────────────────────────
export const publishToQueue = async (queue, message) => {
  try {
    if (!channel) throw new Error('RabbitMQ not connected')
    channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }   // message survives broker restart
    )
    logger.info(`📤 Published to ${queue}`, { message })
  } catch (err) {
    logger.error('RabbitMQ publish failed', { error: err.message })
  }
}

// ── Consumer: process notification queue ─────────────────
const consumeNotifications = async () => {
  await channel.consume(QUEUES.NOTIFICATIONS, async (msg) => {
    if (!msg) return

    try {
      const payload = JSON.parse(msg.content.toString())
      logger.info('📥 Processing notification', { payload })

      // Import here to avoid circular dependency
      const { sendNotification } = await import('./socketService.js')
      sendNotification(payload.userId, {
        type:    payload.type    || 'info',
        title:   payload.title   || 'Notification',
        message: payload.message || '',
        data:    payload.data    || {},
      })

      channel.ack(msg)   // acknowledge — remove from queue
    } catch (err) {
      logger.error('Notification processing failed', { error: err.message })
      channel.nack(msg, false, false)   // reject, don't requeue
    }
  })
}

export { QUEUES }
export const getChannel = () => channel
