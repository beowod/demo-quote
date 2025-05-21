// migrations/seed.js
const fs      = require('fs');
const path    = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_DIR  = './data';
const DB_FILE = process.env.DATABASE_FILE || path.join(DB_DIR, 'demo.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  //
  // 1) Schema: branch-aware inventory + updated reservations
  //
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      branch    TEXT,
      size      TEXT,
      available INTEGER,
      PRIMARY KEY(branch, size)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id             TEXT PRIMARY KEY,
      branch         TEXT,
      size           TEXT,
      quantity       INTEGER,
      startDate      TEXT,
      endDate        TEXT,
      customerName   TEXT,
      customerEmail  TEXT,
      customerPhone  TEXT,
      quote          REAL,
      timestamp      TEXT,
      status         TEXT      DEFAULT 'active',
      cancelledAt    TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS lastQuote (
      id    INTEGER PRIMARY KEY,
      quote REAL
    )
  `);
  db.run(`INSERT OR IGNORE INTO lastQuote (id, quote) VALUES (1, 0)`);

  //
  // 2) Seed inventory for each branch
  //
  const seedByBranch = {
    MAIN:   { small: 3,  medium: 6,  large: 9,  xlarge: 12 },
    NORTE:  { small: 5,  medium: 4,  large: 8,  xlarge: 10 },
    SUR:    { small: 2,  medium: 3,  large: 5,  xlarge: 7 }
  };

  const stmt = db.prepare(
    `INSERT OR REPLACE INTO inventory (branch, size, available)
     VALUES (?, ?, ?)`
  );

  for (const [branch, sizes] of Object.entries(seedByBranch)) {
    for (const [size, avail] of Object.entries(sizes)) {
      stmt.run(branch, size, avail);
    }
  }
  stmt.finalize();

  console.log('Database seeded with branch-aware inventory:', seedByBranch);
  db.close();
});
