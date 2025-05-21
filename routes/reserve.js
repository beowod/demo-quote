// routes/reserve.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dao = require('../dao/dataFacade');
const router = express.Router();

router.post('/', async (req, res) => {
  // TODO: implement reservation logic
  res.json({ reservationId: uuidv4(), quote: 0 });
});

module.exports = router;
