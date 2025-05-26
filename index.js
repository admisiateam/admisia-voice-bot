const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// Paso 1: Primer contacto con audio grabado
app.post('/voice', (req, res) => {
  const twiml = `
    <Response>
      <Play>/intro.mp3</Play>
      <Gather input="speech" action="/respuesta" method="POST" language="es-ES" timeout="5">
        <Say language="es-ES" voice="woman">¿En qué puedo ayudarte?</Say>
      </Gather>
      <Say language="es-ES" voice="woman">No te he entendido. Adiós.</Say>
    </Response>
  `;
  res.type('text/xml');
  res.send(twiml);
});

// Paso 2: Procesa la respuesta, la manda a OpenAI, genera voz con ElevenLabs
app.post('/respuesta', async (req, res) => {
  const userInput = req.body.SpeechResult || 'No entendí';
  const openaiKey = process.env.OPENAI_API_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = 'UOIqAnmS11Reiei1Ytkc'; // Laura

  try {
    // Llamada a OpenAI
    const chat = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres Laura, asesora académica de la Universidad Francisco de Vitoria. Responde en español de forma clara, cercana y profesional. No digas que eres una IA.',
          },
          { role: 'user', content: userInput }
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`
        }
      }
    );

    const respuesta = chat.data.choices[0].message.content;

    // Llamada a ElevenLabs
    const audio = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        text: respuesta,
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.7
        }
      },
      {
        headers: {
          'xi-api-key': elevenKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // Guardar audio generado
    fs.writeFileSync(path.join(__dirname, 'public', 'respuesta.mp3'), audio.data);

    // Reproducir y volver al bucle
    const twiml = `
      <Response>
        <Play>/respuesta.mp3</Play>
        <Redirect>/voice</Redirect>
      </Response>
    `;
    res.type('text/xml');
    res.send(twiml);
  } catch (err) {
    console.error(err);
    res.type('text/xml');
    res.send(`
      <Response>
        <Say language="es-ES">Lo siento, ha ocurrido un error. Adiós.</Say>
      </Response>
    `);
  }
});

app.listen(port, () => {
  console.log(`Servidor activo en http://localhost:${port}`);
});
