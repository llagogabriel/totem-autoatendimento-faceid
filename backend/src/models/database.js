import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = process.env.DB_PATH || './database.db'

let db = null
let SQL = null

async function initDb() {
  SQL = await initSqlJs()
  
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH)
      db = new SQL.Database(data)
      console.log('✅ Conectado ao SQLite:', DB_PATH)
    } else {
      db = new SQL.Database()
      console.log('✅ Novo banco de dados criado:', DB_PATH)
      saveDb()
    }
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message)
    throw err
  }
}

function saveDb() {
  try {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(DB_PATH, buffer)
  } catch (err) {
    console.error('❌ Erro ao salvar banco de dados:', err.message)
  }
}

// Executar com Promise
export function dbRun(sql, params = []) {
  return Promise.resolve().then(() => {
    try {
      db.run(sql, params)
      saveDb()
      return { id: null, changes: db.getRowsModified() }
    } catch (err) {
      throw err
    }
  })
}

export function dbGet(sql, params = []) {
  return Promise.resolve().then(() => {
    try {
      const result = db.exec(sql, params)
      if (result.length > 0 && result[0].values.length > 0) {
        const columns = result[0].columns
        const values = result[0].values[0]
        const row = {}
        columns.forEach((col, idx) => {
          row[col] = values[idx]
        })
        return row
      }
      return undefined
    } catch (err) {
      throw err
    }
  })
}

export function dbAll(sql, params = []) {
  return Promise.resolve().then(() => {
    try {
      const result = db.exec(sql, params)
      if (result.length > 0) {
        const columns = result[0].columns
        return result[0].values.map(values => {
          const row = {}
          columns.forEach((col, idx) => {
            row[col] = values[idx]
          })
          return row
        })
      }
      return []
    } catch (err) {
      throw err
    }
  })
}

// Inicializar tabelas
export async function initializeDatabase() {
  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS pessoas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cpf TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        foto BLOB NOT NULL,
        descriptor TEXT,
        status TEXT DEFAULT 'inativo' CHECK(status IN ('ativo', 'inativo', 'bloqueado')),
        data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const columns = await dbAll(`PRAGMA table_info(pessoas)`)
    const hasDescriptor = columns.some(col => col.name === 'descriptor')
    if (!hasDescriptor) {
      await dbRun('ALTER TABLE pessoas ADD COLUMN descriptor TEXT')
      console.log('✅ Adicionada coluna descriptor na tabela pessoas')
    }

    await dbRun(`
      CREATE TABLE IF NOT EXISTS logs_acesso (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cpf TEXT NOT NULL,
        resultado TEXT NOT NULL,
        similaridade REAL,
        descriptor_cadastro TEXT,
        descriptor_captura TEXT,
        foto_captura TEXT,
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(cpf) REFERENCES pessoas(cpf)
      )
    `)

    // Garantir colunas extras caso tabela já exista sem elas
    const logsCols = await dbAll(`PRAGMA table_info(logs_acesso)`)
    const needCols = [
      { name: 'descriptor_cadastro', sql: 'ALTER TABLE logs_acesso ADD COLUMN descriptor_cadastro TEXT' },
      { name: 'descriptor_captura', sql: 'ALTER TABLE logs_acesso ADD COLUMN descriptor_captura TEXT' },
      { name: 'foto_captura', sql: 'ALTER TABLE logs_acesso ADD COLUMN foto_captura TEXT' }
    ]

    for (const col of needCols) {
      const has = logsCols.some(c => c.name === col.name)
      if (!has) {
        await dbRun(col.sql)
        console.log(`✅ Adicionada coluna ${col.name} na tabela logs_acesso`)
      }
    }

    console.log('✅ Tabelas inicializadas')
  } catch (err) {
    console.error('❌ Erro ao inicializar tabelas:', err)
    throw err
  }
}

export { initDb }
export default db
