import { dbRun, dbGet, dbAll } from '../models/database.js'
// IMPORTAÇÃO CORRIGIDA: Pegando as funções reais com os nomes exatos do seu faceRecognition.js
import { compararRostos, saoRostosIguais } from './faceRecognition.js'

/**
 * Busca uma pessoa pelo CPF
 */
export async function buscarPorCPF(cpf) {
  try {
    const p = await dbGet(
      'SELECT id, cpf, nome, foto, descriptor, status FROM pessoas WHERE cpf = ?',
      [cpf]
    )
    return p
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
export async function cadastrar(cpf, nome, fotoBase64, descriptor) {
  try {
    await dbRun(
      `INSERT INTO pessoas (cpf, nome, foto, descriptor, status) 
       VALUES (?, ?, ?, ?, 'inativo')`,
      [cpf, nome, fotoBase64, JSON.stringify(descriptor)]
    )
    console.log(`✅ Pessoa cadastrada com IA: ${nome} (${cpf})`)
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
 * Compara foto capturada com o descritor facial salvo no banco
 * Retorna similaridade real baseada em Distância Euclidiana
 */
export async function compararFoto(cpf, descriptorCaptura) {
  try {
    const pessoa = await buscarPorCPF(cpf)
    if (!pessoa) {
      throw new Error('Pessoa não encontrada')
    }
    if (!pessoa.descriptor) {
      throw new Error('Pessoa não possui descriptor facial cadastrado')
    }

    // GARANTIA DE CONVERSÃO DE TIPO:
    // Se por acaso o banco trouxer como string, fazemos o parse. Se já for objeto, mantemos.
    const descriptorArmazenado = typeof pessoa.descriptor === 'string' 
      ? JSON.parse(pessoa.descriptor) 
      : pessoa.descriptor;

    console.log(`\n🔄 Executando análise matemática vetorial para CPF: ${cpf}`)
    
    // O threshold do seu .env será avaliado corretamente
    const thresholdDoEnv = parseInt(process.env.SIMILARITY_THRESHOLD || 70)
    
    // Invocamos o seu faceRecognition.js passando duas ARRAYS legítimas
    const similaridade = compararRostos(descriptorArmazenado, descriptorCaptura)
    const passou = saoRostosIguais(similaridade, thresholdDoEnv)

    // Registra a auditoria de acesso no banco de dados
    await dbRun(
      `INSERT INTO logs_acesso (cpf, resultado, similaridade) 
       VALUES (?, ?, ?)`,
      [cpf, passou ? 'aprovado' : 'rejeitado', similaridade]
    )

    console.log(`📊 Resultado Biometria: ${passou ? '✅ APROVADO' : '❌ REJEITADO'} (Similaridade: ${similaridade}%)`)

    return {
      aprovado: passou,
      similaridade,
      threshold: thresholdDoEnv,
      mensagem: passou 
        ? 'Rosto reconhecido com sucesso via rede neural' 
        : `Acesso negado: traços faciais não conferem (${similaridade}% < ${thresholdDoEnv}%)`
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