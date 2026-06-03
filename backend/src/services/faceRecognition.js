export function calcularDistanciaEuclidiana(descriptor1, descriptor2) {
  if (!Array.isArray(descriptor1) || !Array.isArray(descriptor2)) {
    throw new Error('Descriptors inválidos')
  }
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptors com tamanhos diferentes')
  }

  let somaQuadrados = 0
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i]
    somaQuadrados += diff * diff
  }

  return Math.sqrt(somaQuadrados)
}

export function compararRostos(descriptorArmazenado, descriptorCaptura) {
  try {
    const distancia = calcularDistanciaEuclidiana(descriptorArmazenado, descriptorCaptura)
    const similaridade = Math.max(0, Math.min(100, 120 - distancia * 100))
    console.log(`📊 Distância Euclidiana: ${distancia.toFixed(4)} | Similaridade: ${similaridade.toFixed(2)}%`)
    return parseFloat(similaridade.toFixed(2))
  } catch (err) {
    console.error('❌ Erro ao comparar descritores:', err)
    throw err
  }
}

export function saoRostosIguais(similaridade, threshold = 70) {
  return similaridade >= threshold
}

export default { compararRostos, saoRostosIguais, calcularDistanciaEuclidiana }
