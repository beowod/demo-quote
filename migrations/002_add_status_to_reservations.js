// migrations/002_add_status_to_reservations.js

const path    = require('path');
const sqlite3 = require('sqlite3').verbose();

// 1) Define the migration steps
async function up(db) {
  await run(db, `
    CREATE TABLE IF NOT EXISTS _reservations_new (
      id           TEXT PRIMARY KEY,
      size         TEXT,
      quantity     INTEGER,
      startDate    TEXT,
      endDate      TEXT,
      customerName TEXT,
      customerEmail TEXT,
      customerPhone TEXT,
      quote        REAL,
      timestamp    TEXT,
      status       TEXT      DEFAULT 'active',
      cancelledAt  TEXT
    );
  `);

  await run(db, `
    INSERT INTO _reservations_new (
      id, size, quantity, startDate, endDate,
      customerName, customerEmail, customerPhone, quote, timestamp
    )
    SELECT 
      id, size, quantity, startDate, endDate,
      customerName, customerEmail, customerPhone, quote, timestamp
    FROM reservations;
  `);

  await run(db, `DROP TABLE reservations;`);
  await run(db, `ALTER TABLE _reservations_new RENAME TO reservations;`);
}

async function down(db) {
  await run(db, `
    CREATE TABLE IF NOT EXISTS _reservations_old (
      id           TEXT PRIMARY KEY,
      size         TEXT,
      quantity     INTEGER,
      startDate    TEXT,
      endDate      TEXT,
      customerName TEXT,
      customerEmail TEXT,
      customerPhone TEXT,
      quote        REAL,
      timestamp    TEXT
    );
  `);

  await run(db, `
    INSERT INTO _reservations_old (
      id, size, quantity, startDate, endDate,
      customerName, customerEmail, customerPhone, quote, timestamp
    )
    SELECT 
      id, size, quantity, startDate, endDate,
      customerName, customerEmail, customerPhone, quote, timestamp
    FROM reservations;
  `);

  await run(db, `DROP TABLE reservations;`);
  await run(db, `ALTER TABLE _reservations_old RENAME TO reservations;`);
}

// helper to promisify db.run
function run(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, err => err ? reject(err) : resolve());
  });
}

// export for programmatic use
module.exports = { up, down };

// allow this script to be run directly
if (require.main === module) {
  const dbFile = path.join(__dirname, '../data/demo.db');
  const db     = new sqlite3.Database(dbFile);

  up(db)
    .then(() => {
      console.log('✅ Migration 002_add_status_to_reservations applied.');
      db.close();
    })
    .catch(err => {
      console.error('❌ Migration failed:', err);
      db.close();
      process.exit(1);
    });
}
