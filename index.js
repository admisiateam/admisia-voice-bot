const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));

// Ruta inicial que lanza la conversación
app.post('/voice', (req, res) => {
  const twiml = `
    <Response>
      <Gather input="speech" action="/response" method="POST" language="es-ES" timeout="5">
        <Say voice="woman" language="es-ES">Hola, soy Laura, asesora académica. ¿En qué puedo ayudarte?</Say>
      </Gather>
      <Say voice="woman" language="es-ES">No te he entendido, lo intentamos más tarde. Adiós.</Say>
    </Response>
  `;
  res.type('text/xml');
  res.send(twiml);
});

// Ruta que procesa lo que dice el usuario y responde con IA
app.post('/response', async (req, res) => {
  const userSpeech = req.body.SpeechResult || 'No se recibió ningún mensaje';

  // Llama a OpenAI
  const prompt = `Actúa como asesora académica de una universidad. Responde de forma clara y útil a lo siguiente: "${userSpeech}"`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const gptReply = response.data.choices[0].message.content;

    const twiml = `
      <Response>
        <Say voice="woman" language="es-ES">${gptReply}</Say>
      </Response>
    `;

    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('Error al llamar a OpenAI:', error.message);
    const fallback = `
      <Response>
        <Say voice="woman" language="es-ES">Lo siento, ha habido un error técnico. Inténtalo más tarde.</Say>
      </Response>
    `;
    res.type('text/xml');
    res.send(fallback);
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
