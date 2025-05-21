// routes/inventory.js
const express = require('express');
const dao     = require('../dao/dataFacade');
const router  = express.Router();

router.get('/', async (req, res) => {
  try {
    const inv = await dao.getInventory();
    // inv is an object { small:10, medium:8, … }
    return res.json(inv);
  } catch (err) {
    console.error('Error in /api/inventory:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

module.exports = router;
