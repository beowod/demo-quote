// dao/dataFacade.js

// pick your implementation:
let impl = null;
try {
  impl = require('./sqliteDao');
} catch(_) {
  impl = require('./memoryDao');
}

module.exports = {
  getInventory:        (...args) => impl.getInventory(...args),
  adjustInventory:     (...args) => impl.adjustInventory(...args),
  releaseInventory:    (...args) => impl.releaseInventory(...args),
  createReservation:   (res)    => impl.createReservation(res),
  getReservation:      (id,em)  => impl.getReservation(id,em),
  cancelReservation:   (id,em)  => impl.cancelReservation(id,em),
  getCancellationMetrics: ()    => impl.getCancellationMetrics(),
  getAllReservations:  ()        => impl.getAllReservations(),
  getReservationById:  (id)      => impl.getReservationById(id)

};
