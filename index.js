const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

let chatHistory = [
  {
    role: 'system',
    content:
      'Eres Laura, asesora académica de la Universidad Francisco de Vitoria. Responde en español de forma natural, cercana y profesional. Evita sonar como un robot. No repitas frases como "Estoy aquí para ayudarte" ni "¿En qué puedo ayudarte?" tras cada respuesta. Mantén la conversación fluida y sin frases vacías.',
  },
];

// Ruta inicial: reproduce audio de bienvenida y escucha
app.post('/voice', (req, res) => {
  const twiml = `
    <Response>
      <Play>https://web-production-0568c.up.railway.app/respuesta.mp3</Play>
      <Gather input="speech" action="/respuesta" method="POST" language="es-ES" timeout="10">
      </Gather>
      <Say language="es-ES" voice="woman">No he escuchado nada. Hasta luego.</Say>
    </Response>
  `;
  res.type('text/xml');
  res.send(twiml);
});

// Ruta que procesa la respuesta del usuario
app.post('/respuesta', async (req, res) => {
  const userInput = req.body.SpeechResult || 'No entendí';

  const openaiKey = process.env.OPENAI_API_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = 'UOIqAnmS11Reiei1Ytkc'; // Laura

  try {
    // Añadir input del usuario al historial
    chatHistory.push({ role: 'user', content: userInput });

    // Petición a OpenAI con historial
    const chat = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: chatHistory,
      },
      {
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const respuesta = chat.data.choices[0].message.content;

    // Añadir respuesta de la IA al historial
    chatHistory.push({ role: 'assistant', content: respuesta });

    // Convertir respuesta en voz con ElevenLabs
    const audio = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        text: respuesta,
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.7,
        },
      },
      {
        headers: {
          'xi-api-key': elevenKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    fs.writeFileSync(path.join(__dirname, 'public', 'respuesta.mp3'), audio.data);

    // Reproducir y volver a escuchar
    const twiml = `
      <Response>
        <Play>/respuesta.mp3</Play>
        <Redirect>/voice</Redirect>
      </Response>
    `;
    res.type('text/xml');
    res.send(twiml);
  } catch (err) {
    console.error('ERROR:', err.message);
    res.type('text/xml');
    res.send(`
      <Response>
        <Say language="es-ES">Ha ocurrido un error. Hasta luego.</Say>
      </Response>
    `);
  }
});

app.listen(port, () => {
  console.log(`Servidor activo en http://localhost:${port}`);
});
