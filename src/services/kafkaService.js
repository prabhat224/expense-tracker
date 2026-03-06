import { Kafka, Partitioners } from 'kafkajs'
import logger from '../utils/logger.js'

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'budget-api',
  brokers:  [process.env.KAFKA_BROKER   || 'localhost:9092'],
  retry:    { initialRetryTime: 300, retries: 5, maxRetryTime: 30000 },
})

export const TOPICS = {
  BUDGET_EVENTS:  'budget.events',
  EXPENSE_EVENTS: 'expense.events',
  USER_EVENTS:    'user.events',
  ORDER_EVENTS:   'order.events',
}

// ── Admin — ensure all topics exist ──────────────────────
const ensureTopics = async () => {
  const admin    = kafka.admin()
  await admin.connect()
  const existing = await admin.listTopics()
  const missing  = Object.values(TOPICS).filter(t => !existing.includes(t))

  if (missing.length) {
    await admin.createTopics({
      topics: missing.map(topic => ({ topic, numPartitions: 1, replicationFactor: 1 })),
    })
    logger.info(`✅ Kafka topics created: ${missing.join(', ')}`)
  } else {
    logger.info('✅ Kafka topics ready')
  }
  await admin.disconnect()
}

// ── Producer ──────────────────────────────────────────────
const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner })

export const initKafkaProducer = async () => {
  await ensureTopics()
  await producer.connect()
  logger.info('✅ Kafka producer connected')
}

export const publishEvent = async (topic, event) => {
  try {
    await producer.send({
      topic,
      messages: [{ key: String(event.userId || 'system'), value: JSON.stringify({ ...event, timestamp: new Date().toISOString() }) }],
    })
    logger.info(`📤 Kafka → ${topic}: ${event.type}`)
  } catch (err) {
    logger.error('Kafka publish failed', { error: err.message })
  }
}

// ── Consumer ──────────────────────────────────────────────
const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || 'budget-group' })

export const initKafkaConsumer = async () => {
  await consumer.connect()

  for (const topic of Object.values(TOPICS)) {
    await consumer.subscribe({ topic, fromBeginning: false })
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const event = JSON.parse(message.value.toString())
        logger.info(`📥 Kafka ← ${topic}: ${event.type}`)
        await handleKafkaEvent(topic, event)
      } catch (err) {
        logger.error('Kafka handler failed', { error: err.message })
      }
    },
  })

  logger.info('✅ Kafka consumer running')
}

// ── Handlers ──────────────────────────────────────────────
const handleKafkaEvent = async (topic, event) => {
  const { sendNotification }       = await import('./socketService.js')
  const { publishToQueue, QUEUES } = await import('./rabbitMQService.js')

  switch (topic) {
    case TOPICS.BUDGET_EVENTS:
      if (event.type === 'BUDGET_CREATED') {
        sendNotification(event.userId, {
          type:    'success',
          title:   'Budget Created ✅',
          message: `"${event.data?.name}" — limit ₹${event.data?.limit}`,
          data:    event.data,
        })
      }
      if (event.type === 'BUDGET_LIMIT_WARNING') {
        sendNotification(event.userId, {
          type:    'warning',
          title:   '⚠️ Budget Warning',
          message: `"${event.data?.name}" is ${event.data?.percentage}% spent`,
          data:    event.data,
        })
        await publishToQueue(QUEUES.EMAIL, {
          subject: `Budget Alert: ${event.data?.name}`,
          body:    `Your budget is ${event.data?.percentage}% spent`,
        })
      }
      break

    case TOPICS.EXPENSE_EVENTS:
      if (event.type === 'EXPENSE_CREATED') {
        sendNotification(event.userId, {
          type:    'info',
          title:   'Expense Recorded',
          message: `₹${event.data?.amount} — "${event.data?.description}"`,
          data:    event.data,
        })
      }
      break

    case TOPICS.ORDER_EVENTS:
      if (event.type === 'ORDER_STATUS_CHANGED') {
        sendNotification(event.userId, {
          type:    'info',
          title:   'Order Updated',
          message: `Order #${event.data?.orderId} → ${event.data?.status}`,
          data:    event.data,
        })
      }
      break
  }
}

export { producer, consumer }
