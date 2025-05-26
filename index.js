const express = require('express');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: false }));

app.post('/voice', (req, res) => {
  const twiml = `
    <Response>
      <Say voice="woman" language="es-ES">Hola. Esta es una llamada de prueba del sistema AdmisIA. Gracias por tu interés.</Say>
    </Response>
  `;
  res.type('text/xml');
  res.send(twiml);
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
