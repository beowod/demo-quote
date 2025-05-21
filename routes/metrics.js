// routes/metrics.js

const express = require('express');
const dao     = require('../dao/dataFacade');
const router  = express.Router();

router.get('/cancellations', async (req, res) => {
  try {
    const count = await dao.getCancellationMetrics();
    res.json({ cancelledReservations: count });
  } catch (err) {
    console.error('Metrics error', err);
    res.status(500).json({ error: 'error interno' });
  }
});

module.exports = router;
