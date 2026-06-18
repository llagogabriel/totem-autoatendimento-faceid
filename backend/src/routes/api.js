import express from 'express'
import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
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
 * GET /api/pessoas
 * Lista pessoas, aceita query param `busca`
 */
router.get('/pessoas', async (req, res) => {
  try {
    const { busca = '' } = req.query
    console.log(`\n📍 GET /api/pessoas?busca=${busca}`)

    const pessoas = await pessoasService.listarTodas(busca)
    res.json(pessoas)
  } catch (err) {
    console.error('Erro:', err)
    res.status(500).json({ erro: 'Erro ao listar pessoas' })
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
 * POST /api/pessoas
 * Cadastra uma nova pessoa
 * Body: { cpf, nome, foto }
 */
router.post('/pessoas', async (req, res) => {
  try {
    const { cpf, nome, foto, descriptor } = req.body

    // Log incoming request summary for debugging network/size issues
    console.log(`\n📍 POST /api/pessoas - recebendo cadastro`)
    console.log('Headers:', {
      host: req.headers.host,
      origin: req.headers.origin,
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    })

    const fotoLen = typeof foto === 'string' ? foto.length : 0
    const descriptorLen = Array.isArray(descriptor) ? descriptor.length : (descriptor ? String(descriptor).length : 0)
    console.log(`Payload sizes -> foto: ${fotoLen} chars, descriptor: ${descriptorLen}`)

    if (!cpf || !nome || !foto || !descriptor) {
      console.warn('⚠️ Dados obrigatórios faltando no body:', {
        cpf: !!cpf,
        nome: !!nome,
        foto: !!foto,
        descriptor: !!descriptor
      })
      return res.status(400).json({ erro: 'cpf, nome, foto e descriptor são obrigatórios' })
    }

    console.log(`\n📍 POST /api/pessoas - Cadastrando ${cpf}`)

    const resultado = await pessoasService.cadastrar(cpf, nome, foto, descriptor)
    res.status(201).json({ mensagem: 'Pessoa cadastrada', pessoa: resultado })
  } catch (err) {
    console.error('Erro ao cadastrar pessoa:', err)
    res.status(400).json({ erro: err.message || 'Erro ao cadastrar pessoa' })
  }
})

/**
 * POST /api/comparar
 * Compara descritor capturado com descritor cadastrado no banco
 * Body: { cpf, fotoCapturaBase64, descriptorCaptura }
 */
/**
 * POST /api/comparar
 * Compara descritor capturado com descritor cadastrado no banco
 * Body: { cpf, fotoCapturaBase64, descriptorCaptura }
 */
router.post('/comparar', async (req, res) => {
  try {
    const { cpf, fotoCapturaBase64, descriptorCaptura } = req.body

    if (!cpf || !fotoCapturaBase64 || !descriptorCaptura) {
      return res.status(400).json({
        erro: 'cpf, fotoCapturaBase64 e descriptorCaptura são obrigatórios'
      })
    }

    console.log(`\n📍 POST /api/comparar - CPF: ${cpf}`)

    // CORREÇÃO DE POSIÇÃO: Enviamos exatamente os parâmetros que o pessoasService espera receber
    const resultado = await pessoasService.compararFoto(
      cpf,
      descriptorCaptura,
      fotoCapturaBase64
    )

    res.status(200).json(resultado)
  } catch (err) {
    console.error('Erro na rota /comparar:', err)
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
 * PUT /api/bloquear/:cpf
 * Bloqueia permanentemente o usuário (status = 'bloqueado')
 */
router.put('/bloquear/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params
    console.log(`\n📍 PUT /api/bloquear/${cpf}`)
    const resultado = await pessoasService.bloquear(cpf)
    res.json(resultado)
  } catch (err) {
    console.error('Erro ao bloquear:', err)
    res.status(400).json({ erro: err.message || 'Erro ao bloquear usuário' })
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
 * DELETE /api/pessoas/:cpf
 * Exclui cadastro de pessoa
 */
router.delete('/pessoas/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params
    console.log(`\n📍 DELETE /api/pessoas/${cpf}`)

    const resultado = await pessoasService.excluirPessoa(cpf)
    res.json(resultado)
  } catch (err) {
    console.error('Erro ao excluir pessoa:', err)
    res.status(400).json({ erro: err.message || 'Erro ao excluir pessoa' })
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
 * GET /api/logs/:id
 * Retorna log específico com CPF, descritores e imagens em base64
 */
router.get('/logs/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`\n📍 GET /api/logs/${id}`)

    const log = await pessoasService.buscarLogPorId(parseInt(id))
    if (!log) return res.status(404).json({ erro: 'Log não encontrado' })

    res.json(log)
  } catch (err) {
    console.error('Erro ao buscar log por id:', err)
    res.status(500).json({ erro: 'Erro ao buscar log' })
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

/**
 * GET /api/camera/frame
 * Captura um frame único da câmera RTSP usando ffmpeg e retorna como image/jpeg
 * Query param `url` pode sobrepor a variável de ambiente CAMERA_RTSP_URL
 */
router.get('/camera/frame', async (req, res) => {
  try {
    const rtspUrl = req.query.url || process.env.CAMERA_RTSP_URL
    console.log('\n📍 GET /api/camera/frame - url=', rtspUrl)

    if (!rtspUrl) {
      return res.status(400).json({ erro: 'URL da câmera RTSP não informada' })
    }

    // Execução do ffmpeg para capturar um frame e enviar no stdout
    const ffmpegArgs = [
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-frames:v', '1',
      '-q:v', '2',
      '-f', 'image2',
      'pipe:1'
    ]

    const ffBinary = ffmpegPath || 'ffmpeg'
    const ff = spawn(ffBinary, ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] })

    // Timeout de segurança (5s)
    const timeout = setTimeout(() => {
      ff.kill('SIGKILL')
      if (!res.headersSent) res.status(504).json({ erro: 'Timeout ao capturar frame' })
    }, 5000)

    // Cabeçalhos importantes para uso via browser (CORS + evitar cache)
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')

    ff.stdout.on('data', (chunk) => {
      res.write(chunk)
    })

    ff.on('close', (code) => {
      clearTimeout(timeout)
      if (!res.headersSent) {
        if (code === 0) {
          res.end()
        } else {
          res.status(500).json({ erro: `ffmpeg retornou código ${code}` })
        }
      }
    })

    ff.stderr.on('data', (data) => {
      // log útil para debug
      console.debug('ffmpeg:', data.toString())
    })
  } catch (err) {
    console.error('Erro ao capturar frame:', err)
    if (!res.headersSent) res.status(500).json({ erro: 'Erro ao capturar frame' })
  }
})

export default router
