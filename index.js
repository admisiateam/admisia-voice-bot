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
      <Play>https://${req.headers.host}/Intro.mp3</Play>
      <Gather input="speech" action="/response" method="POST" language="es-ES" timeout="5">
        <Say voice="woman" language="es-ES">Hola. ¿En qué puedo ayudarte?</Say>
      </Gather>
      <Say voice="woman" language="es-ES">No te he entendido, por favor intenta de nuevo.</Say>
      <Redirect>/voice</Redirect>
    </Response>
  `;
  res.type('text/xml');
  res.send(twiml);
});

app.post('/response', async (req, res) => {
  const userInput = req.body.SpeechResult || 'No se ha recibido nada';

  try {
    const completion = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres Laura, asesora académica de la Universidad Francisco de Vitoria. Responde de forma cercana, útil y profesional a las preguntas sobre grados, salidas profesionales o dudas académicas. No digas que eres una IA. No repitas la misma frase.',
          },
          {
            role: 'user',
            content: userInput,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = completion.data.choices[0].message.content;

    const twiml = `
      <Response>
        <Say voice="woman" language="es-ES">${reply}</Say>
        <Redirect>/voice</Redirect>
      </Response>
    `;
    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('Error con OpenAI:', error.message);
    const twiml = `
      <Response>
        <Say voice="woman" language="es-ES">Lo siento, ha ocurrido un error. Intenta llamar más tarde.</Say>
      </Response>
    `;
    res.type('text/xml');
    res.send(twiml);
  }
});

app.listen(port, () => {
  console.log(`Servidor activo en http://localhost:${port}`);
});
