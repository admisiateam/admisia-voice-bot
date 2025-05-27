const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

const voiceId = 'UOIqAnmS11Reiei1Ytkc'; // Laura

// Ruta de inicio: genera saludo y escucha al usuario
app.post('/voice', async (req, res) => {
  const saludo = 'Hola, soy Laura, asesora académica de la Universidad Francisco de Vitoria. ¿En qué puedo ayudarte?';

  try {
    const bienvenidaAudio = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        text: saludo,
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.7,
        },
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    fs.writeFileSync(path.join(__dirname, 'public', 'respuesta.mp3'), bienvenidaAudio.data);

    const twiml = `
      <Response>
        <Play>/respuesta.mp3</Play>
        <Gather input="speech" action="/respuesta" method="POST" language="es-ES" timeout="10" />
        <Say language="es-ES">No he escuchado nada. Hasta luego.</Say>
      </Response>
    `;
    res.type('text/xml');
    res.send(twiml);
  } catch (err) {
    console.error('Error en /voice:', err.message);
    res.type('text/xml');
    res.send('<Response><Say>Ha ocurrido un error. Adiós.</Say></Response>');
  }
});

// Ruta para procesar la respuesta del usuario
app.post('/respuesta', async (req, res) => {
  const userInput = req.body.SpeechResult || 'No entendí';

  try {
    const completion = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'Eres Laura, asesora académica de la Universidad Francisco de Vitoria. Tu voz debe sonar cálida, cercana y profesional. No repitas frases como "Estoy aquí para ayudarte" o "¿En qué puedo ayudarte?". Responde de forma directa, útil y coherente, como una persona real. Evita sonar como un asistente artificial.',
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

    const respuestaIA = completion.data.choices[0].message.content;

    const audioIA = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        text: respuestaIA,
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.7,
        },
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    fs.writeFileSync(path.join(__dirname, 'public', 'respuesta.mp3'), audioIA.data);

    const twiml = `
      <Response>
        <Play>/respuesta.mp3</Play>
        <Redirect>/voice</Redirect>
      </Response>
    `;
    res.type('text/xml');
    res.send(twiml);
  } catch (err) {
    console.error('Error en /respuesta:', err.message);
    res.type('text/xml');
    res.send('<Response><Say>Ha ocurrido un error. Adiós.</Say></Response>');
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
