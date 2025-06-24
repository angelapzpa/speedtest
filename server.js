const express = require('express');
const path = require('path');
const app = express();

// Middleware para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Ruta para prueba de velocidad
app.post('/speedtest', (req, res) => {
    const startTime = Date.now();
    let received = 0;
    
    req.on('data', (chunk) => {
        received += chunk.length;
    });

    req.on('end', () => {
        const duration = (Date.now() - startTime) / 1000; // en segundos
        const speedMbps = (received * 8) / (duration * 1024 * 1024);
        
        res.json({
            status: 'success',
            download: speedMbps.toFixed(2),
            upload: (Math.random() * 10 + 5).toFixed(2), // Simulamos subida
            ping: (Math.random() * 30 + 5).toFixed(0),
            jitter: (Math.random() * 5 + 1).toFixed(1)
        });
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});