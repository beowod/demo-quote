// routes/cancel.js

const express = require('express');
const dao     = require('../dao/dataFacade');
const router  = express.Router();

router.delete('/', async (req, res) => {
  const { id, email } = req.body || {};
  if (!id || !email) {
    return res.status(400).json({ error: 'faltan campos' });
  }

  try {
    // 1) fetch reservation
    const r = await dao.getReservation(id, email);
    if (!r) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    if (r.status === 'cancelled') {
      return res.status(400).json({ error: 'Ya está cancelada' });
    }

    // 2) cancel & release inventory
    await dao.cancelReservation(id, email);
    await dao.releaseInventory(r.size, r.quantity, r.branch);

    // 3) return updated inventory
    const inv = await dao.getInventory(r.branch);
    res.json({ inventory: inv, cancelled: true });
  } catch (err) {
    console.error('Cancel error', err);
    res.status(500).json({ error: 'error interno' });
  }
});

module.exports = router;
