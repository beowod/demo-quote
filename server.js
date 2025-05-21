// server.js

require('dotenv').config();
const express = require('express');
const path    = require('path');

const inventoryRoute   = require('./routes/inventory');
const quoteRoute       = require('./routes/quote');
const reserveRoute     = require('./routes/reserve');
const cancelRoute      = require('./routes/cancel');
const reservationRoute = require('./routes/reservation');
const metricsRoute     = require('./routes/metrics');
const adminRoute       = require('./routes/admin');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API mounts
app.use('/api/inventory',   inventoryRoute);
app.use('/api/quote',       quoteRoute);
app.use('/api/reserve',     reserveRoute);
app.use('/api/cancel',      cancelRoute);
app.use('/api/reservation', reservationRoute);
app.use('/api/metrics',     metricsRoute);
app.use('/api/admin',   adminRoute);

// fallback SPA
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

const PORT = process.env.PORT || 7071;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
