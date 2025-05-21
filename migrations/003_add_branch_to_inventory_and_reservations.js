// migrations/003_add_branch_to_reservations.js

const path    = require('path');
const sqlite3 = require('sqlite3').verbose();

// Helper to promisify db.exec
function run(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, err => err ? reject(err) : resolve());
  });
}

async function up(db) {
  // Only add branch to reservations (seed.py already built branch-aware inventory)
  await run(db, `
    ALTER TABLE reservations
    ADD COLUMN branch TEXT DEFAULT 'MAIN';
  `);
}

async function down(db) {
  // Remove the branch column by recreating original table
  await run(db, `
    CREATE TABLE IF NOT EXISTS _reservations_old (
      id             TEXT PRIMARY KEY,
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
    );
  `);
  await run(db, `
    INSERT INTO _reservations_old (
      id, size, quantity, startDate, endDate,
      customerName, customerEmail, customerPhone,
      quote, timestamp, status, cancelledAt
    )
    SELECT
      id, size, quantity, startDate, endDate,
      customerName, customerEmail, customerPhone,
      quote, timestamp, status, cancelledAt
    FROM reservations;
  `);
  await run(db, `DROP TABLE reservations;`);
  await run(db, `ALTER TABLE _reservations_old RENAME TO reservations;`);
}

module.exports = { up, down };

// If you run this file directly:
if (require.main === module) {
  const dbFile = path.join(__dirname, '../data/demo.db');
  const db     = new sqlite3.Database(dbFile);
  up(db)
    .then(() => {
      console.log('✅ Migration 003_add_branch_to_reservations applied.');
      db.close();
    })
    .catch(err => {
      console.error('❌ Migration 003 failed:', err);
      db.close();
      process.exit(1);
    });
}
