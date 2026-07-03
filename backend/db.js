const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'appointments.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function initDb() {
  const database = getDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      name TEXT,
      service TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 30,
      calendar_event_id TEXT,
      status TEXT DEFAULT 'confirmed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_phone ON appointments(phone);
    CREATE INDEX IF NOT EXISTS idx_date ON appointments(date);
    CREATE INDEX IF NOT EXISTS idx_status ON appointments(status);
  `);

  // Add reminder columns if not exist (safe to run on existing DB)
  const cols = database.prepare("PRAGMA table_info(appointments)").all().map(c => c.name);
  if (!cols.includes('reminder_24h_sent')) {
    database.exec("ALTER TABLE appointments ADD COLUMN reminder_24h_sent INTEGER DEFAULT 0");
  }
  if (!cols.includes('reminder_2h_sent')) {
    database.exec("ALTER TABLE appointments ADD COLUMN reminder_2h_sent INTEGER DEFAULT 0");
  }
  console.log('DB ready');
}

module.exports = { getDb, initDb };
