const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.post('/voice', (req, res) => {
  const twiml = `
    <Response>
      <Play>https://web-production-0568c.up.railway.app/respuesta.mp3</Play>
    </Response>
  `;
  res.type('text/xml');
  res.send(twiml);
});

app.listen(port, () => {
  console.log(`Servidor activo en http://localhost:${port}`);
});
