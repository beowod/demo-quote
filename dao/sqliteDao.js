// dao/sqliteDao.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(process.env.DATABASE_FILE || './data/demo.db');

module.exports = {
  init: () => Promise.resolve(),

  getInventory: () =>
    new Promise((resolve, reject) =>
      db.all('SELECT size, available FROM inventory', (e, rows) =>
        e ? reject(e) : resolve(rows.reduce((acc, r) => (acc[r.size]=r.available, acc), {}))
      )
    ),

  adjustInventory: (size, qty) =>
    new Promise((resolve, reject) =>
      db.run('UPDATE inventory SET available = available - ? WHERE size = ?', [qty, size], e =>
        e ? reject(e) : resolve()
      )
    ),

  getLastQuote: () =>
    new Promise((resolve, reject) =>
      db.get('SELECT quote FROM lastQuote WHERE id = 1', (e, row) =>
        e ? reject(e) : resolve(row ? row.quote : 0)
      )
    ),

  setLastQuote: (quote) =>
    new Promise((resolve, reject) =>
      db.run(
        `INSERT INTO lastQuote (id, quote) VALUES (1, ?)
         ON CONFLICT(id) DO UPDATE SET quote = excluded.quote`,
        [quote],
        e => e ? reject(e) : resolve()
      )
    ),

  createReservation: (reservation) =>
    new Promise((resolve, reject) =>
      db.run(
        `INSERT INTO reservations 
         (id,size,quantity,startDate,endDate,customerName,customerEmail,customerPhone,quote,timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reservation.id,
          reservation.size,
          reservation.quantity,
          reservation.startDate,
          reservation.endDate,
          reservation.customerName,
          reservation.customerEmail,
          reservation.customerPhone,
          reservation.quote,
          reservation.timestamp
        ],
        e => e ? reject(e) : resolve(reservation.id)
      )
    )
};
