import { dbRun, dbGet, dbAll } from '../models/database.js'
import { compararRostos, saoRostosIguais } from './faceRecognition.js'

/**
 * Busca uma pessoa pelo CPF
 */
export async function buscarPorCPF(cpf) {
  try {
    const pessoa = await dbGet(
      'SELECT id, cpf, nome, foto, status FROM pessoas WHERE cpf = ?',
      [cpf]
    )
    return pessoa
  } catch (err) {
    console.error('Erro ao buscar pessoa:', err)
    throw err
  }
}

/**
 * Busca todas as pessoas
 */
export async function listarTodas() {
  try {
    const pessoas = await dbAll(
      'SELECT id, cpf, nome, status FROM pessoas'
    )
    return pessoas
  } catch (err) {
    console.error('Erro ao listar pessoas:', err)
    throw err
  }
}

/**
 * Cadastra uma nova pessoa
 */
export async function cadastrar(cpf, nome, fotoBase64) {
  try {
    await dbRun(
      `INSERT INTO pessoas (cpf, nome, foto, status) 
       VALUES (?, ?, ?, 'inativo')`,
      [cpf, nome, fotoBase64]
    )
    console.log(`✅ Pessoa cadastrada: ${nome} (${cpf})`)
    return { cpf, nome, status: 'inativo' }
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      throw new Error('CPF já cadastrado')
    }
    console.error('Erro ao cadastrar pessoa:', err)
    throw err
  }
}

/**
 * Compara foto capturada com foto no BD
 * Retorna similaridade e se passou no threshold
 */
export async function compararFoto(cpf, fotoCapturaBase64, threshold = 99) {
  try {
    const pessoa = await buscarPorCPF(cpf)
    if (!pessoa) {
      throw new Error('Pessoa não encontrada')
    }

    console.log(`\n🔄 Comparando rosto para CPF: ${cpf}`)
    const similaridade = await compararRostos(pessoa.foto, fotoCapturaBase64)
    const passou = saoRostosIguais(similaridade, threshold)

    // Log de acesso
    await dbRun(
      `INSERT INTO logs_acesso (cpf, resultado, similaridade) 
       VALUES (?, ?, ?)`,
      [cpf, passou ? 'aprovado' : 'rejeitado', similaridade]
    )

    console.log(`📊 Resultado: ${passou ? '✅ APROVADO' : '❌ REJEITADO'}`)

    return {
      aprovado: passou,
      similaridade,
      threshold,
      mensagem: passou 
        ? 'Rosto reconhecido com sucesso' 
        : `Similaridade abaixo do threshold (${similaridade.toFixed(2)}% < ${threshold}%)`
    }
  } catch (err) {
    console.error('❌ Erro ao comparar foto:', err)
    throw err
  }
}

/**
 * Autoriza uma pessoa (muda status para 'ativo')
 */
export async function autorizar(cpf) {
  try {
    const pessoa = await buscarPorCPF(cpf)
    if (!pessoa) {
      throw new Error('Pessoa não encontrada')
    }

    await dbRun(
      'UPDATE pessoas SET status = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE cpf = ?',
      ['ativo', cpf]
    )

    console.log(`✅ Autorizado acesso para: ${cpf}`)
    return { cpf, status: 'ativo', mensagem: 'Pessoa autorizada com sucesso' }
  } catch (err) {
    console.error('Erro ao autorizar pessoa:', err)
    throw err
  }
}

/**
 * Revoga autorização (muda status para 'inativo')
 */
export async function revogar(cpf) {
  try {
    const pessoa = await buscarPorCPF(cpf)
    if (!pessoa) {
      throw new Error('Pessoa não encontrada')
    }

    await dbRun(
      'UPDATE pessoas SET status = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE cpf = ?',
      ['inativo', cpf]
    )

    console.log(`❌ Acesso revogado para: ${cpf}`)
    return { cpf, status: 'inativo', mensagem: 'Acesso revogado' }
  } catch (err) {
    console.error('Erro ao revogar pessoa:', err)
    throw err
  }
}

/**
 * Busca logs de acesso
 */
export async function buscarLogs(cpf = null, limite = 50) {
  try {
    let query = 'SELECT * FROM logs_acesso'
    let params = []

    if (cpf) {
      query += ' WHERE cpf = ?'
      params.push(cpf)
    }

    query += ' ORDER BY data_hora DESC LIMIT ?'
    params.push(limite)

    const logs = await dbAll(query, params)
    return logs
  } catch (err) {
    console.error('Erro ao buscar logs:', err)
    throw err
  }
}

export default {
  buscarPorCPF,
  listarTodas,
  cadastrar,
  compararFoto,
  autorizar,
  revogar,
  buscarLogs
}
