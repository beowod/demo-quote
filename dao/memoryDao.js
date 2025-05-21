// dao/memoryDao.js

// in-memory store: branches → sizes
const inventoryStore = {
  MAIN: { small:3, medium:6, large:9, xlarge:12 },
  // you can seed other branches here
};

// simple reservation store
const reservations = [];

module.exports = {
  async getInventory(branch = 'MAIN') {
    return { ... (inventoryStore[branch] || {}) };
  },

  async adjustInventory(size, qty, branch = 'MAIN') {
    inventoryStore[branch][size] -= qty;
  },

  async releaseInventory(size, qty, branch = 'MAIN') {
    inventoryStore[branch][size] += qty;
  },

  async createReservation(res) {
    reservations.push({ ...res });
  },

  async getReservation(id, email) {
    return reservations.find(r =>
      r.id === id && r.customerEmail === email
    ) || null;
  },

  async cancelReservation(id, email) {
    const r = reservations.find(x =>
      x.id === id && x.customerEmail === email
    );
    if (r) {
      r.status = 'cancelled';
      r.cancelledAt = new Date().toISOString();
    }
  },

  async getCancellationMetrics() {
    return reservations.filter(r => r.status === 'cancelled').length;
  },
  async getAllReservations() {
    return reservations.map(r => ({ ...r }));
  },
  async getReservationById(id) {
    return reservations.find(r => r.id === id) || null;
  }
};
