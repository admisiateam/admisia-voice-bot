const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

let chatHistory = []; // Historial de conversación

// INICIO DE LLAMADA
app.post('/voice', async (req, res) => {
  // Resetear historial en cada llamada
  chatHistory = [
    {
      role: 'system',
      content:
        'Eres Laura, asesora académica de la Universidad Francisco de Vitoria. Responde de forma natural, fluida y profesional. Evita frases robóticas como "Estoy aquí para ayudarte" o "¿En qué puedo ayudarte?" tras cada respuesta. Saluda siempre al principio diciendo "Hola, soy Laura, asesora académica de la Universidad Francisco de Vitoria. ¿En qué puedo ayudarte?".',
    },
    {
      role: 'assistant',
      content:
        'Hola, soy Laura, asesora académica de la Universidad Francisco de Vitoria. ¿En qué puedo ayudarte?',
    },
  ];

  const openaiKey = process.env.OPENAI_API_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = 'UOIqAnmS11Reiei1Ytkc'; // Laura

  // Generar audio de saludo de bienvenida
  try {
    const bienvenidaAudio = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        text: chatHistory[1].content,
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
  } catch (error) {
    console.error('Error al generar bienvenida:', error.message);
    res.type('text/xml');
    res.send(`<Response><Say>Ha ocurrido un error. Adiós.</Say></Response>`);
  }
});

// RESPUESTA A LA VOZ DEL USUARIO
app.post('/respuesta', async (req, res) => {
  const userInput = req.body.SpeechResult || 'No entendí';
  const openaiKey = process.env.OPENAI_API_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = 'UOIqAnmS11Reiei1Ytkc';

  chatHistory.push({ role: 'user', content: userInput });

  try {
    // Llamada a GPT-4
    const completion = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: chatHistory.slice(-6), // Últimos 6 mensajes (mantiene contexto sin lentitud)
      },
      {
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const respuestaIA = completion.data.choices[0].message.content;
    chatHistory.push({ role: 'assistant', content: respuestaIA });

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
          'xi-api-key': elevenKey,
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
  } catch (error) {
    console.error('ERROR:', error.message);
    res.type('text/xml');
    res.send(`<Response><Say>Ha ocurrido un error. Adiós.</Say></Response>`);
  }
});

app.listen(port, () => {
  console.log(`Servidor activo en http://localhost:${port}`);
});
