import 'dotenv/config'
import * as pessoasService from '../src/services/pessoasService.js'
import { initializeDatabase } from '../src/models/database.js'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Cria uma imagem de teste usando Sharp
 */
async function criarImagemTeste(texto, cor) {
  const svg = Buffer.from(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${cor}"/>
      <text x="50" y="100" font-size="24" fill="white" font-family="Arial">
        ${texto}
      </text>
    </svg>
  `)

  const png = await sharp(svg).png().toBuffer()
  return png.toString('base64')
}

/**
 * Popula o banco com dados de teste
 */
async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...\n')

    await initializeDatabase()

    // Criar imagens de teste
    console.log('📸 Gerando imagens de teste...')
    const fotoGabriel = await criarImagemTeste('Gabriel', '#3B82F6')
    const fotoAna = await criarImagemTeste('Ana', '#10B981')
    const fotoCarlos = await criarImagemTeste('Carlos', '#F59E0B')

    // Dados de teste
    const pessoas = [
      {
        cpf: '123.456.789-00',
        nome: 'GABRIEL ALVES DE OLIVEIRA',
        foto: fotoGabriel
      },
      {
        cpf: '987.654.321-00',
        nome: 'ANA SILVA SANTOS',
        foto: fotoAna
      },
      {
        cpf: '111.222.333-44',
        nome: 'CARLOS PEREIRA COSTA',
        foto: fotoCarlos
      }
    ]

    // Cadastrar pessoas
    console.log('\n👥 Cadastrando pessoas...')
    for (const pessoa of pessoas) {
      try {
        await pessoasService.cadastrar(
          pessoa.cpf,
          pessoa.nome,
          `data:image/png;base64,${pessoa.foto}`
        )
        console.log(`   ✅ ${pessoa.nome}`)
      } catch (err) {
        console.log(`   ⚠️  ${pessoa.nome} - ${err.message}`)
      }
    }

    console.log('\n✅ Seed concluído!')
    console.log('\n📋 Dados de teste disponíveis:')
    console.log('   CPF: 123.456.789-00 - GABRIEL ALVES DE OLIVEIRA')
    console.log('   CPF: 987.654.321-00 - ANA SILVA SANTOS')
    console.log('   CPF: 111.222.333-44 - CARLOS PEREIRA COSTA')
    
    process.exit(0)
  } catch (err) {
    console.error('❌ Erro ao fazer seed:', err)
    process.exit(1)
  }
}

// Executar
seedDatabase()
