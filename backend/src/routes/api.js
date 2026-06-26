import express from 'express'
import { spawn } from 'child_process'
import * as pessoasService from '../services/pessoasService.js'
import ffmpeg from 'fluent-ffmpeg'

const router = express.Router();
const RTSP_URL = 'rtsp://10.132.5.101:554/user=admin&password=&channel=1&stream=0.sdp';

/**
 * GET /api/pessoas/:cpf
 * Busca dados da pessoa pelo CPF
 */
router.get('/pessoas/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params
    console.log(`\n📍 GET /api/pessoas/${cpf}`)

    const pessoa = await pessoasService.buscarPorCPF(cpf)
    
    // CORREÇÃO: Removido o !person intruso
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
 * Busca a foto completa da pessoa para a Tela de Confirmação
 */
router.get('/pessoas/:cpf/foto', async (req, res) => {
  try {
    const { cpf } = req.params
    console.log(`\n📍 GET /api/pessoas/${cpf}/foto`)

    const pessoa = await pessoasService.buscarPorCPF(cpf)
    
    if (!pessoa || !pessoa.foto) {
      return res.status(404).json({ erro: 'Foto não encontrada' })
    }

    // FIX DEFINTIVO: Alterado de p.foto para pessoa.foto
    res.json({ foto: pessoa.foto })
  } catch (err) {
    console.error('Erro:', err)
    res.status(500).json({ erro: 'Erro ao buscar foto' })
  }
})

/**
 * POST /api/pessoas
 * Cadastra uma nova pessoa
 */
router.post('/pessoas', async (req, res) => {
  try {
    const { cpf, nome, foto, descriptor } = req.body

    console.log(`\n📍 POST /api/pessoas - recebendo cadastro`)
    
    const fotoLen = typeof foto === 'string' ? foto.length : 0
    const descriptorLen = Array.isArray(descriptor) ? descriptor.length : (descriptor ? String(descriptor).length : 0)
    console.log(`Payload sizes -> foto: ${fotoLen} chars, descriptor: ${descriptorLen}`)

    if (!cpf || !nome || !foto || !descriptor) {
      return res.status(400).json({ erro: 'cpf, nome, foto e descriptor são obrigatórios' })
    }

    const resultado = await pessoasService.cadastrar(cpf, nome, foto, descriptor)
    res.status(201).json({ mensagem: 'Pessoa cadastrada', pessoa: resultado })
  } catch (err) {
    console.error('Erro ao cadastrar pessoa:', err)
    res.status(400).json({ erro: err.message || 'Erro ao cadastrar pessoa' })
  }
})

/**
 * POST /api/comparar
 * Compara descritor aplicando tolerância de +10% para longas distâncias
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

    const resultadoPuro = await pessoasService.compararFoto(
      cpf,
      descriptorCaptura,
      fotoCapturaBase64
    )

    // Ajuste matemático de compensação (+10% de similaridade)
    const novaSimilaridade = Math.min(100, resultadoPuro.similaridade + 10)
    const novoAprovado = novaSimilaridade >= 70

    const resultadoCalibrado = {
      ...resultadoPuro,
      similaridade: novaSimilaridade,
      aprovado: novoAprovado
    }

    console.log(`📊 Ajuste Biométrico -> Original: ${resultadoPuro.similaridade.toFixed(2)}% | Com Bônus: ${novaSimilaridade.toFixed(2)}% | Status: ${novoAprovado ? 'APROVADO' : 'REPROVADO'}`)

    res.status(200).json(resultadoCalibrado)
  } catch (err) {
    console.error('Erro na rota /comparar:', err)
    res.status(400).json({
      erro: err.message || 'Erro ao comparar rostos'
    })
  }
})

/**
 * PUT /api/autorizar/:cpf
 */
router.put('/autorizar/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params
    console.log(`\n📍 PUT /api/autorizar/${cpf}`)
    const resultado = await pessoasService.autorizar(cpf)
    res.json(resultado)
  } catch (err) {
    console.error('Erro:', err)
    res.status(400).json({ erro: err.message || 'Erro ao autorizar pessoa' })
  }
})

/**
 * PUT /api/bloquear/:cpf
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
 */
router.put('/revogar/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params
    console.log(`\n📍 PUT /api/revogar/${cpf}`)
    const resultado = await pessoasService.revogar(cpf)
    res.json(resultado)
  } catch (err) {
    console.error('Erro:', err)
    res.status(400).json({ erro: err.message || 'Erro ao revogar pessoa' })
  }
})

/**
 * DELETE /api/pessoas/:cpf
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
 */
router.get('/camera/frame', async (req, res) => {
  try {
    const rtspUrl = req.query.url || process.env.CAMERA_RTSP_URL
    if (!rtspUrl) {
      return res.status(400).json({ erro: 'URL da câmera RTSP não informada' })
    }

    const ffmpegArgs = ['-rtsp_transport', 'tcp', '-i', rtspUrl, '-frames:v', '1', '-f', 'mjpeg', 'pipe:1']
    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] })
    const chunks = []

    const timeout = setTimeout(() => {
      ffmpegProcess.kill('SIGKILL')
      if (!res.headersSent) res.status(504).json({ erro: 'Timeout' })
    }, 30000)

    ffmpegProcess.stdout.on('data', (chunk) => chunks.push(chunk))
    ffmpegProcess.on('close', () => {
      clearTimeout(timeout)
      const imageBuffer = Buffer.concat(chunks)
      if (imageBuffer.length > 0) {
        res.setHeader('Content-Type', 'image/jpeg')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.end(imageBuffer)
      }
      if (!res.headersSent) return res.status(500).json({ erro: 'Erro frame' })
    })
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ erro: 'Erro' })
  }
})

/**
 * GET /api/camera/stream
 */
router.get('/camera/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=--frame',
    'Cache-Control': 'no-store, no-cache, must-revalidate, pre-check=0, post-check=0',
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
    'Access-Control-Allow-Origin': '*'
  });

  const rtspUrl = process.env.CAMERA_RTSP_URL || RTSP_URL;
  const ffmpegArgs = ['-rtsp_transport', 'tcp', '-i', rtspUrl, '-vcodec', 'mjpeg', '-f', 'mpjpeg', '-boundary_tag', 'frame', '-q:v', '5', 'pipe:1'];
  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

  ffmpegProcess.stdout.pipe(res);
  req.on('close', () => {
    ffmpegProcess.kill('SIGKILL');
  });
});

export default router