// routes/inventory.js

const express = require('express');
const dao     = require('../dao/dataFacade');
const router  = express.Router();

router.get('/', async (req, res) => {
  const branch = req.query.branch || 'MAIN';
  try {
    const inv = await dao.getInventory(branch);
    res.json(inv);
  } catch (err) {
    console.error('Inventory error', err);
    res.status(500).json({ error: 'error interno' });
  }
});

module.exports = router;
