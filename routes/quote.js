// routes/quote.js

const express = require('express');
const dao     = require('../dao/dataFacade');
const router  = express.Router();

// Simple per-day pricing — you can also move this to env/config
const PRICING = { small:10, medium:15, large:20, xlarge:30 };

router.post('/', async (req, res) => {
  const { branch = 'MAIN', size, quantity, days } = req.body || {};

  if (!size || !quantity || !days) {
    return res.status(400).json({ error: 'size, quantity and days are required.' });
  }

  try {
    const inv = await dao.getInventory(branch);
    if (!(size in inv)) {
      return res.status(400).json({ error: 'invalid container size.' });
    }
    const qty = parseInt(quantity, 10);
    if (qty > inv[size]) {
      return res.status(400).json({ error: 'No hay suficiente inventario' });
    }
    const d = parseInt(days, 10);
    const cost = qty * d * PRICING[size];
    res.json({ quote: cost.toFixed(2) });
  } catch (err) {
    console.error('Quote error', err);
    res.status(500).json({ error: 'error interno' });
  }
});

module.exports = router;
