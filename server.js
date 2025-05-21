// server.js - Entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const quoteRouter = require('./routes/quote');
const reserveRouter = require('./routes/reserve');
const inventoryRouter = require('./routes/inventory');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/quote', quoteRouter);
app.use('/api/reserve', reserveRouter);
app.use('/api/inventory', inventoryRouter);

const PORT = process.env.PORT || 7071;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
