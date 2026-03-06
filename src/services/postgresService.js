import pkg from 'pg'
const { Pool } = pkg
import logger from '../utils/logger.js'

const pool = new Pool({
  host:     process.env.PG_HOST     || 'localhost',
  port:     Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'budget_audit',
  user:     process.env.PG_USER,
  password: process.env.PG_PASSWORD || '',
})

pool.on('connect', () => logger.info('✅ PostgreSQL connected'))
pool.on('error',  (err) => logger.error('❌ PostgreSQL error', { error: err.message }))

// ── Bootstrap — create audit table if it doesn't exist ───
export const initPostgres = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL,
      action      VARCHAR(50) NOT NULL,
      entity      VARCHAR(50) NOT NULL,
      entity_id   INTEGER,
      payload     JSONB,
      ip_address  VARCHAR(45),
      user_agent  VARCHAR(255),
      created_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_entity  ON audit_log(entity, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
  `)
  logger.info('✅ PostgreSQL audit table ready')
}

// ── Write an audit entry ──────────────────────────────────
export const writeAudit = async ({ userId, action, entity, entityId, payload, ip, userAgent }) => {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, action, entity, entity_id, payload, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entity, entityId || null, payload ? JSON.stringify(payload) : null, ip || null, userAgent || null]
    )
  } catch (err) {
    // Never crash the main request if audit fails
    logger.error('Audit write failed', { error: err.message })
  }
}

// ── Read audit log ────────────────────────────────────────
export const getAuditLog = async ({ userId, entity, limit = 50, offset = 0 }) => {
  const conditions = []
  const values     = []
  let   idx        = 1

  if (userId) { conditions.push(`user_id = $${idx++}`);  values.push(userId)  }
  if (entity) { conditions.push(`entity  = $${idx++}`);  values.push(entity)  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await pool.query(
    `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
    [...values, limit, offset]
  )
  return result.rows
}

export default pool
