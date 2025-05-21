// routes/reserve.js

const express   = require('express');
const { v4: uuidv4 } = require('uuid');
const dao       = require('../dao/dataFacade');
const twilio    = require('twilio');
const router    = express.Router();

// Twilio credentials from .env
const client      = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const FROM_WHATSAPP = process.env.TWILIO_WHATSAPP_FROM;

router.post('/', async (req, res) => {
  const b = req.body || {};
  console.log('[DEBUG] Incoming request body:', b);  // <-- log the full request body

  const {
    branch, size, quantity,
    startDate, endDate,
    customerName, customerEmail, customerPhone,
    quote
  } = b;
  

  // validate
  if (!branch || !size || !quantity || !startDate || !endDate || !customerName || !customerEmail || !customerPhone) {
    return res.status(400).json({ error: 'faltan campos' });
  }

  try {
    // 1) check & adjust inventory
    const inv = await dao.getInventory(branch);
    if (quantity > inv[size]) {
      return res.status(400).json({ error: 'No hay suficiente inventario' });
    }
    await dao.adjustInventory(size, quantity, branch);

    // 2) create reservation
    const id = uuidv4();
    const reservation = {
      id, branch, size, quantity,
      startDate, endDate,
      customerName, customerEmail, customerPhone,
      quote, timestamp: new Date().toISOString(),
      status: 'active', cancelledAt: null
    };
    await dao.createReservation(reservation);

    // 3) attempt WhatsApp send
    let waSent = false;
    try {
      let num = customerPhone.replace(/\D/g,'');
      if (num.startsWith('52')) num = num.slice(2);
      const to = 'whatsapp:+521' + num;
      const body = 
        `¡Hola ${customerName}! Tu reserva (${id}) ha sido confirmada en la sucursal *${branch}* : \n` +
        `• Contenedor: ${size.toUpperCase()} x${quantity}\n` +
        `• Fechas: ${startDate} → ${endDate}\n` +
        `• Total: $${quote} MXN`;
      await client.messages.create({ from: FROM_WHATSAPP, to, body });
      waSent = true;
    } catch (e) {
      console.warn('Twilio send failed', e);
    }

    // 4) return updated inventory + reservationId + waSent
    const newInv = await dao.getInventory(branch);
    res.json({ reservationId: id, inventory: newInv, waSent });
  } catch (err) {
    console.error('Reserve error', err);
    res.status(500).json({ error: 'error interno' });
  }
});

module.exports = router;
