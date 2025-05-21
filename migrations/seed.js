// migrations/seed.js
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const dbFile = process.env.DATABASE_FILE || './data/demo.db';

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS inventory (
    size TEXT PRIMARY KEY, available INTEGER
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY, size TEXT, quantity INTEGER,
    startDate TEXT, endDate TEXT,
    customerName TEXT, customerEmail TEXT, customerPhone TEXT,
    quote REAL, timestamp TEXT
  )`);

  // ← add this block:
  db.run(`CREATE TABLE IF NOT EXISTS lastQuote (
    id INTEGER PRIMARY KEY,
    quote REAL
  )`);
  db.run(`INSERT OR IGNORE INTO lastQuote (id, quote) VALUES (1, 0)`);

  // seed inventory:
  const stmt = db.prepare("INSERT OR REPLACE INTO inventory (size, available) VALUES (?, ?)");
  ['small','medium','large','xlarge'].forEach(size => stmt.run(size, 10));
  stmt.finalize();

  console.log('Database seeded.');
  db.close();
});
