const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));

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

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
