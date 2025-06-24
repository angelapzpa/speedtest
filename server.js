const express = require('express');
const path = require('path');
const app = express();

// Configuración para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para la prueba de velocidad
app.post('/speedtest', (req, res) => {
    let received = 0;
    
    req.on('data', (chunk) => {
        received += chunk.length;
    });

    req.on('end', () => {
        res.json({
            status: 'success',
            bytesReceived: received,
            speed_mbps: (received * 8) / (5 * 1024 * 1024) // Corregido el cálculo (bits en lugar de bytes)
        });
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
const PORT = 3000; // Usaremos el puerto 3000
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});