const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Configuración
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// Ruta para ping
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Ruta para descarga
app.get('/download', (req, res) => {
  const chunkSize = 1024 * 1024; // 1MB chunks
  const totalSize = 100 * 1024 * 1024; // 100MB máximo
  
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  
  let sent = 0;
  const interval = setInterval(() => {
    if (sent >= totalSize) {
      clearInterval(interval);
      res.end();
      return;
    }
    
    const chunk = Buffer.alloc(Math.min(chunkSize, totalSize - sent));
    res.write(chunk);
    sent += chunk.length;
  }, 10);
});

// Ruta para subida
app.post('/upload', (req, res) => {
  let received = 0;
  req.on('data', (chunk) => {
    received += chunk.length;
  });
  
  req.on('end', () => {
    res.json({ 
      status: 'success',
      bytesReceived: received,
      speed_mbps: (received * 8) / (5 * 1024 * 1024) // 5 segundos de prueba
    });
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});