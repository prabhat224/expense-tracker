import 'dotenv/config'
import http            from 'http'
import express         from 'express'
import helmet          from 'helmet'
import cors            from 'cors'
import cookieParser    from 'cookie-parser'
import rateLimit       from 'express-rate-limit'
import swaggerUi       from 'swagger-ui-express'
import swaggerSpec     from './config/swagger.js'
import routes          from './routes.js'
import { requestLogger }             from './utils/logger.js'
import { errorHandler, notFound }    from './middleware/error.middleware.js'
import logger                        from './utils/logger.js'
import { initPostgres }              from './services/postgresService.js'
import { initElastic }               from './services/elasticService.js'
import { initSocket }                from './services/socketService.js'
import { initRabbitMQ }              from './services/rabbitMQService.js'
import { metricsMiddleware, metricsHandler } from './utils/metrics.js'
import { initKafkaProducer, initKafkaConsumer } from './services/kafkaService.js'
import { createHandler }             from 'graphql-http/lib/use/express'
import schema                        from '../graphql/schema.js'
import { buildContext }              from '../graphql/context.js'

const app    = express()
const server = http.createServer(app)
const PORT   = process.env.PORT || 3000
const isDev  = process.env.NODE_ENV !== 'production'

// ── Security & Parsing ────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)
app.use(metricsMiddleware)

// ── Rate Limiting ─────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      isDev ? 2000 : 100,
  skip:     () => isDev,
  message:  { success: false, message: 'Too many requests.' },
}))

// ── Docs ──────────────────────────────────────────────────
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ── Metrics ───────────────────────────────────────────────
app.get('/metrics', metricsHandler)

// ── Root & Health ─────────────────────────────────────────
app.get('/', (req, res) => res.json({
  success: true,
  message: '💰 BudgetCo API',
  phase:   'Phase 4+5 — GraphQL + gRPC + CLI + Prometheus',
  docs:    'http://localhost:' + PORT + '/docs',
  graphql: 'http://localhost:' + PORT + '/api/graphql',
  graphiql:'http://localhost:' + PORT + '/api/graphiql',
}))

app.get('/health', async (req, res) => {
  const { default: prisma } = await import('./config/prisma.js')
  const { default: redis  } = await import('./config/redis.js')
  try {
    await prisma.$queryRaw`SELECT 1`
    const redisPing = await redis.ping()
    res.json({
      success:       true,
      mysql:         '✅',
      redis:         redisPing === 'PONG' ? '✅' : '❌',
      elasticsearch: '✅',
      rabbitmq:      '✅',
      kafka:         '✅',
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GraphQL API endpoint ──────────────────────────────────
app.use('/api/graphql', createHandler({
  schema,
  context: (req) => buildContext(req.raw),
}))

// ── GraphiQL UI ───────────────────────────────────────────
app.get('/api/graphiql', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.end(getGraphiQLHTML())
})

// ── REST API routes ───────────────────────────────────────
app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

// ── GraphiQL HTML (plain function, no template literal nesting issues) ────────
function getGraphiQLHTML () {
  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '  <title>GraphiQL — BudgetCo</title>',
    '  <meta charset="utf-8"/>',
    '  <style>',
    '    *{margin:0;padding:0;box-sizing:border-box}',
    '    body{height:100vh;display:flex;flex-direction:column;font-family:monospace;background:#0d1117;color:#e6edf3}',
    '    #toolbar{padding:10px 16px;background:#161b22;border-bottom:1px solid #30363d;display:flex;align-items:center;gap:10px;flex-shrink:0}',
    '    #toolbar h1{font-size:14px;font-weight:700;color:#58a6ff;white-space:nowrap}',
    '    #token-input{flex:1;max-width:420px;padding:6px 10px;border-radius:6px;border:1px solid #30363d;background:#0d1117;color:#e6edf3;font-size:12px;font-family:monospace}',
    '    #run-btn{padding:6px 18px;background:#238636;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer}',
    '    #run-btn:hover{background:#2ea043}',
    '    .presets{display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px;background:#161b22;border-bottom:1px solid #30363d;flex-shrink:0}',
    '    .q-btn{padding:3px 10px;background:#21262d;border:1px solid #30363d;color:#8b949e;border-radius:4px;font-size:11px;cursor:pointer}',
    '    .q-btn:hover{background:#30363d;color:#e6edf3}',
    '    #main{display:flex;flex:1;overflow:hidden}',
    '    #query-panel{flex:1;display:flex;flex-direction:column;border-right:1px solid #30363d}',
    '    #result-panel{flex:1;display:flex;flex-direction:column}',
    '    .panel-hdr{padding:7px 14px;background:#161b22;border-bottom:1px solid #30363d;font-size:11px;font-weight:600;color:#8b949e;text-transform:uppercase;letter-spacing:.08em;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}',
    '    textarea{flex:1;background:#0d1117;color:#e6edf3;border:none;outline:none;padding:16px;font-family:monospace;font-size:13px;resize:none;line-height:1.7}',
    '    #result{flex:1;background:#0d1117;padding:16px;font-size:13px;overflow:auto;white-space:pre;line-height:1.7}',
    '    .k{color:#79c0ff}.s{color:#a5d6ff}.n{color:#f78166}.b{color:#ff7b72}.null{color:#8b949e}',
    '  </style>',
    '</head>',
    '<body>',
    '  <div id="toolbar">',
    '    <h1>BudgetCo GraphiQL</h1>',
    '    <input id="token-input" type="text" placeholder="Paste JWT token here (required for queries)…"/>',
    '    <button id="run-btn" onclick="run()">Run (Ctrl+Enter)</button>',
    '  </div>',
    '  <div class="presets">',
    '    <span style="font-size:11px;color:#8b949e;align-self:center;margin-right:4px">Presets:</span>',
    '    <button class="q-btn" onclick="load(0)">List Budgets</button>',
    '    <button class="q-btn" onclick="load(1)">List Expenses</button>',
    '    <button class="q-btn" onclick="load(2)">Get Budget</button>',
    '    <button class="q-btn" onclick="load(3)">Create Budget</button>',
    '    <button class="q-btn" onclick="load(4)">Add Expense</button>',
    '    <button class="q-btn" onclick="load(5)">Delete Budget</button>',
    '  </div>',
    '  <div id="main">',
    '    <div id="query-panel">',
    '      <div class="panel-hdr"><span>Query / Mutation</span></div>',
    '      <textarea id="query" spellcheck="false">query {\n  budgets(limit: 5) {\n    id\n    name\n    limit\n    spent\n    category\n  }\n}</textarea>',
    '    </div>',
    '    <div id="result-panel">',
    '      <div class="panel-hdr"><span>Response</span><span id="badge"></span></div>',
    '      <div id="result">// Press Run to execute</div>',
    '    </div>',
    '  </div>',
    '<script>',
    'var Q=[',
    '  "query {\\n  budgets(limit: 10) {\\n    id\\n    name\\n    limit\\n    spent\\n    category\\n    expenses { id description amount }\\n  }\\n}",',
    '  "query {\\n  expenses(limit: 10) {\\n    id\\n    description\\n    amount\\n    category\\n    budget { id name }\\n  }\\n}",',
    '  "query {\\n  budget(id: 1) {\\n    id\\n    name\\n    limit\\n    spent\\n    expenses { id description amount }\\n  }\\n}",',
    '  "mutation {\\n  createBudget(\\n    name: \\"Test Budget\\"\\n    limit: 50000\\n    category: \\"BUSINESS\\"\\n  ) {\\n    id name limit\\n  }\\n}",',
    '  "mutation {\\n  addExpense(\\n    budgetId: 1\\n    description: \\"Office lunch\\"\\n    amount: 850\\n  ) {\\n    id description amount\\n  }\\n}",',
    '  "mutation {\\n  deleteBudget(id: 99)\\n}"',
    '];',
    'function load(i){ document.getElementById("query").value=Q[i]; }',
    'function hi(j){',
    '  return j.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")',
    '    .replace(/("(?:\\\\u[0-9a-fA-F]{4}|\\\\[^u]|[^\\\\"])*"(?:\\s*:)?|\\b(?:true|false)\\b|\\bnull\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)/g,',
    '      function(m){ var c="n"; if(/^"/.test(m)) c=/:$/.test(m)?"k":"s"; else if(/true|false/.test(m)) c="b"; else if(/null/.test(m)) c="null"; return \'<span class="\'+c+\'">\'+m+\'</span>\'; });',
    '}',
    'async function run(){',
    '  var q=document.getElementById("query").value.trim();',
    '  var t=document.getElementById("token-input").value.trim();',
    '  var r=document.getElementById("result");',
    '  var b=document.getElementById("badge");',
    '  r.innerHTML=\'<span style="color:#8b949e">Running…</span>\';',
    '  b.textContent="";',
    '  var h={"Content-Type":"application/json"};',
    '  if(t) h["Authorization"]="Bearer "+t;',
    '  var t0=Date.now();',
    '  try{',
    '    var res=await fetch("/api/graphql",{method:"POST",headers:h,body:JSON.stringify({query:q})});',
    '    var data=await res.json();',
    '    var ms=Date.now()-t0;',
    '    b.innerHTML=\'<span style="color:\'+(res.ok?"#3fb950":"#f85149")+\'">\'+ res.status +\'</span> <span style="color:#8b949e">\'+ ms +\'ms</span>\';',
    '    r.innerHTML=hi(JSON.stringify(data,null,2));',
    '  }catch(e){',
    '    b.innerHTML=\'<span style="color:#f85149">ERROR</span>\';',
    '    r.innerHTML=\'<span style="color:#f85149">\'+e.message+\'</span>\';',
    '  }',
    '}',
    'document.getElementById("query").addEventListener("keydown",function(e){',
    '  if((e.ctrlKey||e.metaKey)&&e.key==="Enter") run();',
    '  if(e.key==="Tab"){e.preventDefault();var ta=e.target,s=ta.selectionStart;ta.value=ta.value.slice(0,s)+"  "+ta.value.slice(ta.selectionEnd);ta.selectionStart=ta.selectionEnd=s+2;}',
    '});',
    '</script>',
    '</body>',
    '</html>'
  ].join('\n')
}

// ── Boot sequence ─────────────────────────────────────────
const start = async () => {
  initSocket(server)
  await initPostgres()
  await initElastic()
  initRabbitMQ().catch(err => logger.warn('RabbitMQ unavailable', { error: err.message }))
  initKafkaProducer().catch(err => logger.warn('Kafka unavailable', { error: err.message }))
  initKafkaConsumer().catch(err => logger.warn('Kafka unavailable', { error: err.message }))

  server.listen(PORT, () => {
    logger.info('🚀 Server:   http://localhost:' + PORT)
    logger.info('📚 Docs:     http://localhost:' + PORT + '/docs')
    logger.info('⬡  GraphQL:  http://localhost:' + PORT + '/api/graphiql')
    logger.info('📊 Metrics:  http://localhost:' + PORT + '/metrics')
    logger.info('🔌 Sockets:  ws://localhost:' + PORT)
  })
}

start()