// Utility to read from cards.db SQLite database
import Database from "better-sqlite3"
import { join } from "path"
import { existsSync } from "fs"

let db: Database.Database | null = null

function getCardsDatabase(): Database.Database {
  if (db) {
    return db
  }

  const dbPath = join(process.cwd(), "data", "cards.db")
  
  if (!existsSync(dbPath)) {
    throw new Error(`Cards database not found at ${dbPath}`)
  }

  try {
    // Try to open database - if it's corrupted, we'll handle it gracefully
    db = new Database(dbPath, { 
      readonly: true,
      fileMustExist: true,
    })
    
    // Try a simple query first to see if database is readable
    try {
      db.prepare("SELECT 1").get()
    } catch (testError: any) {
      if (testError.code === 'SQLITE_CORRUPT') {
        console.error(`Cards database at ${dbPath} appears to be corrupted. Please obtain a new cards.db file.`)
        throw new Error("Cards database is corrupted. Please replace data/cards.db with a valid file.")
      }
      throw testError
    }
    
    // Set pragmas for better compatibility (skip if database is corrupted)
    try {
      db.pragma("journal_mode = OFF")
      db.pragma("synchronous = OFF")
      db.pragma("cache_size = 10000")
      db.pragma("temp_store = MEMORY")
    } catch (pragmaError) {
      // If pragmas fail, database might be corrupted, but try to continue anyway
      console.warn("Failed to set database pragmas, continuing anyway:", pragmaError)
    }
    
    return db
  } catch (error) {
    console.error(`Failed to open cards database at ${dbPath}:`, error)
    // Close and reset on error
    if (db) {
      try {
        db.close()
      } catch (e) {
        // Ignore close errors
      }
      db = null
    }
    throw error
  }
}

export interface Card {
  code: number
  name: string
  desc: string
  atk: number | null
  def: number | null
  level: number | null
  type: number | null
  race: number | null
  attribute: number | null
}

export function searchCardsByName(query: string, limit: number = 20, offset: number = 0): Card[] {
  const database = getCardsDatabase()
  
  // YGOPro card database has two tables:
  // - 'datas' contains card stats (id, atk, def, etc.)
  // - 'texts' contains card text (id, name, desc, etc.)
  // We need to JOIN them to get both code and name
  const stmt = database.prepare(`
    SELECT d.id as code, t.name, t.desc, d.atk, d.def, d.level, d.type, d.race, d.attribute
    FROM datas d
    JOIN texts t ON d.id = t.id
    WHERE t.name LIKE ? COLLATE NOCASE
    ORDER BY t.name
    LIMIT ? OFFSET ?
  `)
  
  const results = stmt.all(`%${query}%`, limit, offset) as Array<Partial<Card>>
  return results.map(result => ({
    code: result.code!,
    name: result.name!,
    desc: result.desc!,
    atk: result.atk ?? null,
    def: result.def ?? null,
    level: result.level ?? null,
    type: result.type ?? null,
    race: result.race ?? null,
    attribute: result.attribute ?? null,
  }))
}

export function getCardByCode(code: number): Card | null {
  const database = getCardsDatabase()
  const stmt = database.prepare(`
    SELECT d.id as code, t.name, t.desc, d.atk, d.def, d.level, d.type, d.race, d.attribute
    FROM datas d
    JOIN texts t ON d.id = t.id
    WHERE d.id = ?
  `)
  const result = stmt.get(code) as Card | undefined
  if (!result) return null
  // Convert nulls and undefineds for optional fields
  return {
    ...result,
    atk: result.atk ?? null,
    def: result.def ?? null,
    level: result.level ?? null,
    type: result.type ?? null,
    race: result.race ?? null,
    attribute: result.attribute ?? null,
  }
}
