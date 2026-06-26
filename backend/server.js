import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initializeDatabase } from './src/models/database.js'
import apiRoutes from './src/routes/api.js'
import { logRequests, handleErrors } from './src/middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 3000
const rawCorsOrigin = process.env.CORS_ORIGIN || ''
const CORS_ORIGIN = rawCorsOrigin === '*'
  ? true
  : rawCorsOrigin
    ? rawCorsOrigin.split(',').map(origin => origin.trim())
    : true

// Middlewares globais
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(logRequests)

// Rotas
app.use('/api', apiRoutes)

// Health check na raiz
app.get('/', (req, res) => {
  res.json({
    mensagem: 'Servidor de Reconhecimento Facial - Backend',
    versao: '1.0.0',
    endpoints: {
      saude: 'GET /api/saude',
      buscarPessoa: 'GET /api/pessoas/:cpf',
      buscarFoto: 'GET /api/pessoas/:cpf/foto',
      comparar: 'POST /api/comparar',
      autorizar: 'PUT /api/autorizar/:cpf',
      revogar: 'PUT /api/revogar/:cpf',
      logs: 'GET /api/logs'
    }
  })
})

// Error handler (deve ser o último)
app.use(handleErrors)

// Iniciar servidor
async function start() {
  try {
    console.log('🔧 Inicializando backend...\n')
    
    // Inicializar banco de dados
    await initializeDatabase()

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`)
      console.log(`📍 CORS permitido para: ${rawCorsOrigin || '* (todos)'}`)
      console.log(`📊 Threshold de similaridade: ${process.env.SIMILARITY_THRESHOLD || 70}%`)
      console.log('\n💡 Endpoints disponíveis:')
      console.log('   GET  /api/saude')
      console.log('   GET  /api/pessoas/:cpf')
      console.log('   GET  /api/pessoas/:cpf/foto')
      console.log('   POST /api/comparar')
      console.log('   PUT  /api/autorizar/:cpf')
      console.log('   PUT  /api/revogar/:cpf')
      console.log('   GET  /api/logs\n')
    })
  } catch (err) {
    console.error('❌ Erro ao iniciar servidor:', err)
    process.exit(1)
  }
}

start()
