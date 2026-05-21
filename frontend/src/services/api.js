import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Busca dados da pessoa pelo CPF
 */
export async function buscarPessoa(cpf) {
  try {
    console.log(`🔍 Buscando pessoa: ${cpf}`)
    const response = await apiClient.get(`/pessoas/${cpf}`)
    console.log('✅ Pessoa encontrada:', response.data)
    return response.data
  } catch (err) {
    console.error('❌ Erro ao buscar pessoa:', err.response?.data || err.message)
    throw new Error(err.response?.data?.erro || 'Pessoa não encontrada')
  }
}

/**
 * Busca a foto da pessoa
 */
export async function buscarFoto(cpf) {
  try {
    console.log(`🖼️  Buscando foto: ${cpf}`)
    const response = await apiClient.get(`/pessoas/${cpf}/foto`)
    return response.data.foto
  } catch (err) {
    console.error('❌ Erro ao buscar foto:', err.message)
    throw new Error('Foto não encontrada')
  }
}

/**
 * Cadastra uma nova pessoa com foto (dataURL)
 * body: { cpf, nome, foto }
 */
export async function cadastrarPessoa(cpf, nome, fotoDataUrl, descriptor) {
  try {
    console.log(`📥 Cadastrando pessoa: ${cpf} - ${nome}`)
    const response = await apiClient.post('/pessoas', {
      cpf,
      nome,
      foto: fotoDataUrl,
      descriptor
    })
    console.log('✅ Cadastro realizado:', response.data)
    return response.data
  } catch (err) {
    console.error('❌ Erro ao cadastrar pessoa:', err.response?.data || err.message)
    throw new Error(err.response?.data?.erro || 'Erro ao cadastrar pessoa')
  }
}

/**
 * Compara a foto capturada com a do banco
 * Retorna { aprovado, similaridade, threshold, mensagem }
 */
export async function compararRosto(cpf, fotoCapturaBase64, descriptorCaptura) {
  try {
    console.log(`📊 Comparando rosto para CPF: ${cpf}`)
    
    const response = await apiClient.post('/comparar', {
      cpf,
      fotoCapturaBase64,
      descriptorCaptura
    })
    
    console.log('✅ Comparação realizada:', response.data)
    return response.data
  } catch (err) {
    console.error('❌ Erro ao comparar rosto:', err.response?.data || err.message)
    throw new Error(err.response?.data?.erro || 'Erro ao comparar rostos')
  }
}

/**
 * Autoriza a pessoa para entrar (status = 'ativo')
 */
export async function autorizarPessoa(cpf) {
  try {
    console.log(`✅ Autorizando pessoa: ${cpf}`)
    
    const response = await apiClient.put(`/autorizar/${cpf}`)
    console.log('✅ Pessoa autorizada:', response.data)
    return response.data
  } catch (err) {
    console.error('❌ Erro ao autorizar:', err.response?.data || err.message)
    throw new Error(err.response?.data?.erro || 'Erro ao autorizar pessoa')
  }
}

/**
 * Revoga o acesso da pessoa (status = 'inativo')
 */
export async function revogarPessoa(cpf) {
  try {
    console.log(`❌ Revogando acesso: ${cpf}`)
    
    const response = await apiClient.put(`/revogar/${cpf}`)
    console.log('✅ Acesso revogado:', response.data)
    return response.data
  } catch (err) {
    console.error('❌ Erro ao revogar:', err.message)
    throw new Error('Erro ao revogar acesso')
  }
}

/**
 * Busca logs de acesso
 */
export async function buscarLogs(cpf = null, limite = 50) {
  try {
    const params = new URLSearchParams()
    if (cpf) params.append('cpf', cpf)
    params.append('limite', limite)

    const response = await apiClient.get(`/logs?${params}`)
    return response.data
  } catch (err) {
    console.error('❌ Erro ao buscar logs:', err.message)
    throw err
  }
}

/**
 * Health check
 */
export async function verificarSaude() {
  try {
    const response = await apiClient.get('/saude')
    return response.data
  } catch (err) {
    console.error('❌ Servidor indisponível:', err.message)
    throw err
  }
}

export default {
  buscarPessoa,
  buscarFoto,
  compararRosto,
  autorizarPessoa,
  cadastrarPessoa,
  revogarPessoa,
  buscarLogs,
  verificarSaude
}
