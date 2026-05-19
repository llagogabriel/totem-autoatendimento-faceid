import express from 'express'
import * as pessoasService from '../services/pessoasService.js'

const router = express.Router()

/**
 * GET /api/pessoas/:cpf
 * Busca dados da pessoa pelo CPF
 */
router.get('/pessoas/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params
    console.log(`\n📍 GET /api/pessoas/${cpf}`)

    const pessoa = await pessoasService.buscarPorCPF(cpf)
    
    if (!pessoa) {
      return res.status(404).json({
        erro: 'Pessoa não encontrada',
        cpf
      })
    }

    // Não retorna foto na busca básica para economizar banda
    res.json({
      id: pessoa.id,
      cpf: pessoa.cpf,
      nome: pessoa.nome,
      status: pessoa.status,
      temFoto: !!pessoa.foto
    })
  } catch (err) {
    console.error('Erro:', err)
    res.status(500).json({ erro: 'Erro ao buscar pessoa' })
  }
})

/**
 * GET /api/pessoas/:cpf/foto
 * Busca a foto completa da pessoa
 */
router.get('/pessoas/:cpf/foto', async (req, res) => {
  try {
    const { cpf } = req.params
    console.log(`\n📍 GET /api/pessoas/${cpf}/foto`)

    const pessoa = await pessoasService.buscarPorCPF(cpf)
    
    if (!pessoa || !pessoa.foto) {
      return res.status(404).json({ erro: 'Foto não encontrada' })
    }

    res.json({ foto: pessoa.foto })
  } catch (err) {
    console.error('Erro:', err)
    res.status(500).json({ erro: 'Erro ao buscar foto' })
  }
})

/**
 * POST /api/comparar
 * Compara foto capturada com foto no banco
 * Body: { cpf, fotoCapturaBase64 }
 */
router.post('/comparar', async (req, res) => {
  try {
    const { cpf, fotoCapturaBase64 } = req.body

    if (!cpf || !fotoCapturaBase64) {
      return res.status(400).json({
        erro: 'CPF e fotoCapturaBase64 são obrigatórios'
      })
    }

    console.log(`\n📍 POST /api/comparar - CPF: ${cpf}`)

    const resultado = await pessoasService.compararFoto(
      cpf,
      fotoCapturaBase64,
      parseInt(process.env.SIMILARITY_THRESHOLD || 99)
    )

    // Retornar com status apropriado
    const statusCode = resultado.aprovado ? 200 : 200 // Mesmo assim retorna 200, mas com aprovado:false
    res.status(statusCode).json(resultado)
  } catch (err) {
    console.error('Erro:', err)
    res.status(400).json({
      erro: err.message || 'Erro ao comparar rostos'
    })
  }
})

/**
 * PUT /api/autorizar/:cpf
 * Autoriza a pessoa para entrar (muda status para 'ativo')
 */
router.put('/autorizar/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params
    console.log(`\n📍 PUT /api/autorizar/${cpf}`)

    const resultado = await pessoasService.autorizar(cpf)
    res.json(resultado)
  } catch (err) {
    console.error('Erro:', err)
    res.status(400).json({
      erro: err.message || 'Erro ao autorizar pessoa'
    })
  }
})

/**
 * PUT /api/revogar/:cpf
 * Revoga acesso da pessoa (muda status para 'inativo')
 */
router.put('/revogar/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params
    console.log(`\n📍 PUT /api/revogar/${cpf}`)

    const resultado = await pessoasService.revogar(cpf)
    res.json(resultado)
  } catch (err) {
    console.error('Erro:', err)
    res.status(400).json({
      erro: err.message || 'Erro ao revogar pessoa'
    })
  }
})

/**
 * GET /api/logs
 * Busca logs de acesso
 * Query: ?cpf=XXX&limite=50
 */
router.get('/logs', async (req, res) => {
  try {
    const { cpf, limite = 50 } = req.query
    console.log(`\n📍 GET /api/logs`)

    const logs = await pessoasService.buscarLogs(cpf, parseInt(limite))
    res.json({ total: logs.length, logs })
  } catch (err) {
    console.error('Erro:', err)
    res.status(500).json({ erro: 'Erro ao buscar logs' })
  }
})

/**
 * GET /api/saude
 * Health check
 */
router.get('/saude', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    ambiente: process.env.NODE_ENV || 'development'
  })
})

export default router
