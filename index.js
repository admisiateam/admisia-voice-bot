const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post('/voice', async (req, res) => {
  const prompt = 'Hola, estás hablando con Laura, asesora virtual de la Universidad Francisco de Vitoria. ¿En qué puedo ayudarte hoy?';

  try {
    const completion = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const respuesta = completion.data.choices[0].message.content;

    const audio = await axios.post(
      'https://api.elevenlabs.io/v1/text-to-speech/UOIqAnmS11Reiei1Ytkc/stream',
      {
        text: respuesta,
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.7
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    res.set('Content-Type', 'audio/mpeg');
    res.send(audio.data);
  } catch (error) {
    console.error('Error en /voice:', error.message);
    res.type('text/xml');
    res.send(`
      <Response>
        <Say language="es-ES" voice="woman">
          Lo siento, ha ocurrido un error al procesar la llamada. Por favor, inténtalo de nuevo más tarde.
        </Say>
      </Response>
    `);
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
