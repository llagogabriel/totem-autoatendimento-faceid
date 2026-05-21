import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = process.env.DB_PATH || './database.db'

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message)
  } else {
    console.log('✅ Conectado ao SQLite:', DB_PATH)
  }
})

// Executar com Promise
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve({ id: this.lastID, changes: this.changes })
    })
  })
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
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
        status TEXT DEFAULT 'inativo' CHECK(status IN ('ativo', 'inativo')),
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
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(cpf) REFERENCES pessoas(cpf)
      )
    `)

    console.log('✅ Tabelas inicializadas')
  } catch (err) {
    console.error('❌ Erro ao inicializar tabelas:', err)
    throw err
  }
}

export default db
