const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));

app.post('/voice', async (req, res) => {
  const voiceId = 'UOIqAnmS11Reiei1Ytkc'; // Laura
  const apiKey = process.env.OPENAI_API_KEY;

  const prompt = 'Hola. Esta es una llamada de prueba del sistema AdmisIA. Gracias por tu interés.';

  try {
    const response = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      data: {
        text: prompt,
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.7
        }
      },
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      }
    });

    const twiml = `
      <Response>
        <Play>${response.request.res.responseUrl}</Play>
      </Response>
    `;
    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generando audio.');
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
