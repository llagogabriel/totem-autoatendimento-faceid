import 'dotenv/config'
import * as pessoasService from '../src/services/pessoasService.js'
import { initializeDatabase } from '../src/models/database.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Busca uma imagem de rosto na internet e converte para Base64
 */
async function obterImagemRosto(id) {
  try {
    const url = `https://i.pravatar.cc/300?img=${id}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Falha ao buscar imagem')
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    return buffer.toString('base64')
  } catch (error) {
    console.error(`Erro ao buscar imagem para o ID ${id}, usando fallback vazio.`)
    return ''
  }
}

function gerarCpfFalso(index) {
  const num = String(index).padStart(9, '0')
  return `${num.slice(0, 3)}.${num.slice(3, 6)}.${num.slice(6, 9)}-00`
}

/**
 * Cria a lista de 30 pessoas com nomes, fotos correspondentes e descritores simulados
 */
function gerarListaPessoas(quantidade) {
  const nomesMasculinos = ['LUCAS', 'JOÃO', 'PEDRO', 'BRUNO', 'FELIPE', 'MATEUS', 'GABRIEL', 'THIAGO', 'RODRIGO', 'DIEGO']
  const nomesFemininos = ['MARIA', 'BEATRIZ', 'LETÍCIA', 'GABRIELA', 'JULIA', 'ANA', 'AMANDA', 'LARISSA', 'CAMILA', 'ALICE']
  
  const sobrenomes1 = ['SILVA', 'SANTOS', 'OLIVEIRA', 'SOUZA', 'RODRIGUES', 'FERREIRA', 'ALVES', 'PEREIRA']
  const sobrenomes2 = ['COSTA', 'GOMES', 'MARTINS', 'RIBEIRO', 'CARVALHO', 'ALMEIDA', 'LOPES', 'SOARES']

  const fotosMasculinas = [11, 12, 13, 14, 18, 33, 50, 51, 52, 55, 56, 57, 59, 60, 61, 62, 67, 68, 69, 70]
  const fotosFemininas = [1, 2, 3, 4, 5, 9, 10, 16, 19, 20, 21, 22, 23, 26, 28, 31, 32, 34, 35, 49]

  const pessoas = []

  for (let i = 1; i <= quantidade; i++) {
    const ehHomem = i % 2 === 0
    let nomeAleatorio, idImagem

    if (ehHomem) {
      nomeAleatorio = nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]
      idImagem = fotosMasculinas[Math.floor(Math.random() * fotosMasculinas.length)]
    } else {
      nomeAleatorio = nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)]
      idImagem = fotosFemininas[Math.floor(Math.random() * fotosFemininas.length)]
    }

    const sob1Aleatorio = sobrenomes1[Math.floor(Math.random() * sobrenomes1.length)]
    const sob2Aleatorio = sobrenomes2[Math.floor(Math.random() * sobrenomes2.length)]
    const nomeCompleto = `${nomeAleatorio} ${sob1Aleatorio} ${sob2Aleatorio}`

    // 🌟 AQUI ESTÁ O TRUQUE: Cria um array com 128 números aleatórios (formato padrão do face-api/mediapipe)
    const descriptorSimulado = Array.from({ length: 128 }, () => Math.random())

    pessoas.push({
      idImagem,
      cpf: gerarCpfFalso(i),
      nome: nomeCompleto,
      generoLog: ehHomem ? 'MASCULINO' : 'FEMININO',
      descriptor: descriptorSimulado // Armazena no objeto temporário
    })
  }

  return pessoas
}

/**
 * Popula o banco com dados de teste
 */
async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed do banco de dados com descritores de teste...\n')

    await initializeDatabase()

    const dadosPessoas = gerarListaPessoas(30)

    console.log('📸 Baixando rostos e salvando cadastros no banco...')
    
    for (const p of dadosPessoas) {
      try {
        const fotoBase64 = await obterImagemRosto(p.idImagem)

        // Enviando também o p.descriptor criado na função anterior
        await pessoasService.cadastrar(
          p.cpf,
          p.nome,
          `data:image/jpeg;base64,${fotoBase64}`,
          p.descriptor 
        )
        console.log(`   ✅ [${p.cpf}] ${p.nome} (${p.generoLog})`)
      } catch (err) {
        console.log(`   ⚠️  ${p.nome} - ${err.message}`)
      }
    }

    console.log('\n✅ Seed concluído! Agora todas as 30 pessoas possuem descritores válidos para a lógica de comparação.')
    process.exit(0)
  } catch (err) {
    console.error('❌ Erro ao fazer seed:', err)
    process.exit(1)
  }
}

// Executar
seedDatabase()