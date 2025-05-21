// routes/admin.js

const express = require('express');
const dao      = require('../dao/dataFacade');
const auth     = require('../dao/authFacade');
const router   = express.Router();

// // Basic-Auth middleware
// router.use(async (req, res, next) => {
//   const header = req.headers.authorization;
//   if (!header || !header.startsWith('Basic ')) {
//     res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
//     return res.status(401).send('Authentication required.');
//   }
//   const [user, pass] = Buffer
//     .from(header.split(' ')[1], 'base64')
//     .toString()
//     .split(':');
//   if (!await auth.authenticate(user, pass)) {
//     return res.status(403).send('Forbidden');
//   }
//   next();
// });

// GET all bookings
router.get('/bookings', async (req, res) => {
  try {
    const all = await dao.getAllReservations();
    res.json(all);
  } catch (err) {
    console.error('Admin bookings error', err);
    res.status(500).json({ error: 'error interno' });
  }
});

// DELETE a booking by ID
router.delete('/booking/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const r = await dao.getReservationById(id);
    if (!r) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (r.status === 'cancelled') {
      return res.status(400).json({ error: 'Ya está cancelada' });
    }
    // cancel + release inventory
    await dao.cancelReservation(id, r.customerEmail);
    await dao.releaseInventory(r.size, r.quantity, r.branch);
    res.json({ cancelled: true });
  } catch (err) {
    console.error('Admin cancel error', err);
    res.status(500).json({ error: 'error interno' });
  }
});

module.exports = router;