const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));

app.post('/voice', async (req, res) => {
  const prompt = 'Hola, ¿qué grados te interesan en nuestra universidad?';
  
  try {
    // Crear texto con OpenAI
    const completion = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const mensajeLimpio = completion.data.choices[0].message.content;

    // Generar audio con ElevenLabs
    const audioResponse = await axios.post(
      'https://api.elevenlabs.io/v1/text-to-speech/UOIqAnmS11Reiei1Ytkc/stream',
      {
        text: mensajeLimpio,
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.7,
        },
      },
      {
        responseType: 'arraybuffer',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    // Guardar el archivo de audio como MP3 temporalmente (solo para pruebas locales)
    const audioBase64 = Buffer.from(audioResponse.data, 'binary').toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    // Respuesta a Twilio
    const twiml = `
      <Response>
        <Play>${audioUrl}</Play>
      </Response>
    `;

    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('Error en la llamada:', error.message);
    res.status(500).send('Error generando audio');
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
  console.log(`Servidor escuchando en el puerto ${port}`);
});
