// dao/memoryDao.js
const inventory    = { small:10, medium:8, large:5, xlarge:3 };
const reservations = [];
let lastQuote = 0;

module.exports = {
  init: () => Promise.resolve(),

  getInventory: () => Promise.resolve({ ...inventory }),

  adjustInventory: (size, qty) => {
    inventory[size] -= qty;
    return Promise.resolve();
  },

  getLastQuote: () => Promise.resolve(lastQuote),

  setLastQuote: (quote) => {
    lastQuote = quote;
    return Promise.resolve();
  },

  createReservation: (reservation) => {
    reservations.push(reservation);
    return Promise.resolve(reservation.id);
  },
};
