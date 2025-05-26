const express = require('express');
const { urlencoded } = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(urlencoded({ extended: false }));

app.post('/voice', (req, res) => {
  const twiml = `
    <Response>
      <Play>/intro.mp3</Play>
      <Pause length="1"/>
      <Gather input="speech dtmf" timeout="10" numDigits="1" action="/handle-speech" method="POST">
        <Say language="es-ES" voice="woman">Pulsa cualquier número o di algo para continuar.</Say>
      </Gather>
      <Say language="es-ES" voice="woman">Lo siento, no recibí respuesta. ¡Hasta luego!</Say>
    </Response>
  `;
  res.type('text/xml');
  res.send(twiml);
});

app.post('/handle-speech', async (req, res) => {
  const userSpeech = req.body.SpeechResult || 'No entendí';
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const elevenApiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = 'UOIqAnmS11Reiei1Ytkc'; // Laura

  try {
    const completion = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres Laura, asesora académica de la Universidad Francisco de Vitoria. Ayuda a los estudiantes a resolver dudas sobre grados, másteres, becas y admisiones.',
          },
          { role: 'user', content: userSpeech },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const respuesta = completion.data.choices[0].message.content;

    const audio = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: respuesta,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.7,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenApiKey,
        },
        responseType: 'arraybuffer',
      }
    );

    require('fs').writeFileSync('./public/respuesta.mp3', audio.data);

    const twiml = `
      <Response>
        <Play>/respuesta.mp3</Play>
      </Response>
    `;
    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    const twiml = `
      <Response>
        <Say language="es-ES" voice="woman">Lo siento, ha ocurrido un error. ¡Hasta luego!</Say>
      </Response>
    `;
    res.type('text/xml');
    res.send(twiml);
  }
});

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
