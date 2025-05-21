// routes/reservation.js

const express = require('express');
const dao     = require('../dao/dataFacade');
const router  = express.Router();

router.get('/', async (req, res) => {
  const { id, email } = req.query || {};
  if (!id || !email) {
    return res.status(400).json({ error: 'faltan id o email' });
  }

  try {
    const r = await dao.getReservation(id, email);
    if (!r) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    res.json(r);
  } catch (err) {
    console.error('Lookup error', err);
    res.status(500).json({ error: 'error interno' });
  }
});

module.exports = router;
