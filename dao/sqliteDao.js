// dao/sqliteDao.js

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const dbFile  = path.join(__dirname, '../data/demo.db');
const db      = new sqlite3.Database(dbFile);

module.exports = {
  getInventory(branch = 'MAIN') {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT size, available FROM inventory WHERE branch = ?',
        [branch],
        (err, rows) => {
          if (err) return reject(err);
          const out = {};
          rows.forEach(r => out[r.size] = r.available);
          resolve(out);
        }
      );
    });
  },

  adjustInventory(size, qty, branch = 'MAIN') {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE inventory SET available = available - ? WHERE branch = ? AND size = ?',
        [qty, branch, size],
        err => err ? reject(err) : resolve()
      );
    });
  },

  releaseInventory(size, qty, branch = 'MAIN') {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE inventory SET available = available + ? WHERE branch = ? AND size = ?',
        [qty, branch, size],
        err => err ? reject(err) : resolve()
      );
    });
  },

  createReservation(res) {
    const {
      id, branch, size, quantity,
      startDate, endDate,
      customerName, customerEmail, customerPhone,
      quote, timestamp, status = 'active', cancelledAt = null
    } = res;
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO reservations (
           id, branch, size, quantity,
           startDate, endDate,
           customerName, customerEmail, customerPhone,
           quote, timestamp, status, cancelledAt
         ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id, branch, size, quantity,
          startDate, endDate,
          customerName, customerEmail, customerPhone,
          quote, timestamp, status, cancelledAt
        ],
        err => err ? reject(err) : resolve()
      );
    });
  },

  getReservation(id, email) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM reservations
         WHERE id = ? AND customerEmail = ?`,
        [id, email],
        (err, row) => err
          ? reject(err)
          : resolve(row || null)
      );
    });
  },

  cancelReservation(id, email) {
    const now = new Date().toISOString();
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE reservations
         SET status = 'cancelled',
             cancelledAt = ?
         WHERE id = ? AND customerEmail = ?`,
        [now, id, email],
        err => err ? reject(err) : resolve()
      );
    });
  },

  getCancellationMetrics() {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) AS cnt
         FROM reservations
         WHERE status = 'cancelled'`,
        (err, row) => err
          ? reject(err)
          : resolve(row.cnt)
      );
    });
  },
    getAllReservations() {
        return new Promise((resolve, reject) => {
          db.all(
            'SELECT * FROM reservations',
            [],
            (err, rows) => err ? reject(err) : resolve(rows)
          );
        });
      },
      getReservationById(id) {
        return new Promise((resolve, reject) => {
          db.get(
            'SELECT * FROM reservations WHERE id = ?',
            [id],
            (err, row) => err ? reject(err) : resolve(row || null)
          );
        });
      }
};
