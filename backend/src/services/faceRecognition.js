import sharp from 'sharp'

/**
 * Extrai características visuais básicas da imagem para comparação
 * Em produção, isso seria um modelo de deep learning
 */
async function extrairCaracteristicas(imagemBase64) {
  try {
    // Remover data URL se presente
    const buffer = Buffer.from(
      imagemBase64.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    )

    // Redimensionar para 64x64 para análise rápida
    const thumbnail = await sharp(buffer)
      .resize(64, 64, { fit: 'cover' })
      .grayscale()
      .raw()
      .toBuffer()

    // Converter buffer em array de pixels
    const pixels = Array.from(thumbnail)

    // Criar hash simples baseado em brilho dos pixels
    const hash = criarHashPerceptual(pixels)
    
    return hash
  } catch (err) {
    console.error('Erro ao extrair características:', err)
    throw new Error('Erro ao processar imagem')
  }
}

/**
 * Cria um hash perceptual da imagem
 * Divide em quadrantes e calcula média de brilho
 */
function criarHashPerceptual(pixels) {
  const numQuadrantes = 16 // 4x4
  const pixelsPorQuadrante = Math.floor(pixels.length / numQuadrantes)
  const hash = []

  for (let i = 0; i < numQuadrantes; i++) {
    const inicio = i * pixelsPorQuadrante
    const fim = inicio + pixelsPorQuadrante
    const quadrante = pixels.slice(inicio, fim)
    const media = quadrante.reduce((a, b) => a + b, 0) / quadrante.length
    hash.push(media > 128 ? 1 : 0)
  }

  return hash
}

/**
 * Compara dois hashes e retorna similaridade em percentual
 */
function calcularSimilaridade(hash1, hash2) {
  if (hash1.length !== hash2.length) {
    throw new Error('Hashes com tamanhos diferentes')
  }

  let matches = 0
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] === hash2[i]) matches++
  }

  // Converter para percentual (0-100)
  return (matches / hash1.length) * 100
}

/**
 * Compara duas imagens e retorna similaridade
 * @param {string} imagem1 - Base64 da primeira imagem
 * @param {string} imagem2 - Base64 da segunda imagem
 * @returns {number} Percentual de similaridade (0-100)
 */
export async function compararRostos(imagem1, imagem2) {
  try {
    console.log('🔍 Extraindo características da primeira imagem...')
    const hash1 = await extrairCaracteristicas(imagem1)

    console.log('🔍 Extraindo características da segunda imagem...')
    const hash2 = await extrairCaracteristicas(imagem2)

    const similaridade = calcularSimilaridade(hash1, hash2)
    
    console.log(`📊 Similaridade calculada: ${similaridade.toFixed(2)}%`)
    
    return parseFloat(similaridade.toFixed(2))
  } catch (err) {
    console.error('❌ Erro ao comparar rostos:', err)
    throw err
  }
}

/**
 * Verifica se duas imagens são do mesmo rosto baseado em threshold
 * @param {number} similaridade - Percentual de similaridade
 * @param {number} threshold - Threshold mínimo (padrão 99%)
 * @returns {boolean}
 */
export function saoRostosIguais(similaridade, threshold = 99) {
  return similaridade >= threshold
}

export default { compararRostos, saoRostosIguais }
