import { Client } from '@elastic/elasticsearch'
import logger from '../utils/logger.js'

const client = new Client({
  node:           process.env.ELASTIC_URL || 'http://localhost:9200',
  requestTimeout: 3000,
})

const INDEX   = 'expenses'
let   isReady = false

export const initElastic = async () => {
  try {
    await client.ping()
    const exists = await client.indices.exists({ index: INDEX })
    if (!exists) {
      await client.indices.create({
        index:    INDEX,
        mappings: {
          properties: {
            id:          { type: 'integer' },
            description: { type: 'text'    },
            category:    { type: 'keyword' },
            amount:      { type: 'float'   },
            ownerId:     { type: 'integer' },
            budgetId:    { type: 'integer' },
            budgetName:  { type: 'keyword' },
            createdAt:   { type: 'date'    },
          },
        },
      })
    }
    isReady = true
    logger.info('✅ Elasticsearch ready')
  } catch (err) {
    isReady = false
    logger.warn('⚠️  Elasticsearch unavailable — search disabled')
  }
}

export const indexExpense  = async (expense) => { if (!isReady) return; try { await client.index({ index: INDEX, id: String(expense.id), document: { id: expense.id, description: expense.description, category: expense.category || '', amount: Number(expense.amount), ownerId: expense.ownerId, budgetId: expense.budgetId, budgetName: expense.budget?.name || '', createdAt: expense.createdAt } }) } catch (err) { logger.error('Elastic index failed', { error: err.message }) } }
export const removeExpense = async (id) => { if (!isReady) return; try { await client.delete({ index: INDEX, id: String(id) }) } catch (err) { logger.error('Elastic delete failed', { error: err.message }) } }

export const searchExpenses = async ({ query, ownerId, category, minAmount, maxAmount, from = 0, size = 20 }) => {
  if (!isReady) return { total: 0, results: [], message: 'Elasticsearch is not running. Install it to enable search.' }

  const must   = []
  const filter = [{ term: { ownerId } }]
  if (query)    must.push({ match: { description: { query, fuzziness: 'AUTO' } } })
  if (category) filter.push({ term: { category } })
  if (minAmount || maxAmount) filter.push({ range: { amount: { ...(minAmount && { gte: Number(minAmount) }), ...(maxAmount && { lte: Number(maxAmount) }) } } })

  const result = await client.search({
    index: INDEX, from, size,
    query: { bool: { must: must.length ? must : [{ match_all: {} }], filter } },
    sort: [{ createdAt: 'desc' }],
    highlight: { fields: { description: {} } },
  })

  return {
    total:   result.hits.total.value,
    results: result.hits.hits.map(hit => ({ ...hit._source, score: hit._score, highlight: hit.highlight?.description?.[0] || null })),
  }
}

export const getElasticStatus = () => isReady
export default client
