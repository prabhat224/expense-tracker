import { createClient } from 'redis'

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

client.on('error', (err) => console.error('❌ Redis error:', err))
client.on('connect', () => console.log('✅ Redis connected'))

await client.connect()

// ── Helpers ───────────────────────────────────────────────
export const getCache = async (key) => {
  const data = await client.get(key)
  return data ? JSON.parse(data) : null
}

export const setCache = async (key, value, ttlSeconds = 300) => {
  await client.setEx(key, ttlSeconds, JSON.stringify(value))
}

export const deleteCache = async (...keys) => {
  if (keys.length) await client.del(keys)
}

export const deleteCachePattern = async (pattern) => {
  const keys = await client.keys(pattern)
  if (keys.length) await client.del(keys)
}

export default client
