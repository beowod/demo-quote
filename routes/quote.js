// routes/quote.js
require('dotenv').config();
const express = require('express');
const dao     = require('../dao/dataFacade');
const router  = express.Router();

// Price per day (override via .env if desired)
const PRICING = {
  small:  parseFloat(process.env.PRICE_SMALL_PER_DAY)  || 10,
  medium: parseFloat(process.env.PRICE_MEDIUM_PER_DAY) || 15,
  large:  parseFloat(process.env.PRICE_LARGE_PER_DAY)  || 20,
  xlarge: parseFloat(process.env.PRICE_XLARGE_PER_DAY) || 30,
};

router.post('/', async (req, res) => {
  try {
    const { size, quantity, days } = req.body;
    if (!size || !quantity || !days) {
      return res.status(400).json({ error: 'size, quantity and days are required.' });
    }
    if (!PRICING[size]) {
      return res.status(400).json({ error: 'invalid container size.' });
    }

    const qty = parseInt(quantity, 10);
    const d   = parseInt(days, 10);
    if (isNaN(qty) || isNaN(d) || qty < 1 || d < 1) {
      return res.status(400).json({ error: 'quantity and days must be positive integers.' });
    }

    const cost = qty * d * PRICING[size];

    // Persist the last quote for use by /reserve
    await dao.setLastQuote(cost);

    return res.json({ quote: cost.toFixed(2) });
  } catch (err) {
    console.error('Error in /api/quote:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

module.exports = router;
