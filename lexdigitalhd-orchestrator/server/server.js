// server/server.js
const express = require('express');
const cors = require('cors'); // Necesario si Astro y Express corren en puertos distintos en desarrollo
const logsRoute = require('./routes/logs');
const { broadcast } = require('./services/sseManager');

const app = express();
app.use(cors()); 
app.use(express.json());

// Registrar rutas
app.use('/api/logs', logsRoute);

// 🚀 Endpoint de prueba: Simular un proceso pesado (ej. un script de Python o UXP)
app.post('/api/pipeline/start', (req, res) => {
    // Respondemos al frontend inmediatamente para no bloquear la UI
    res.json({ status: 'Proceso iniciado' });
    
    broadcast('Iniciando compilación del Código Civil (WCAG 2.2)...', 'info');
    
    // Simulamos un script que tarda varios segundos usando setInterval
    let step = 0;
    const interval = setInterval(() => {
        step++;
        
        if (step === 2) broadcast('Ejecutando Python: procesando imágenes y esquemas...', 'info');
        if (step === 4) broadcast('Advertencia: El contraste de una tabla es bajo', 'warn');
        if (step === 6) broadcast('Aplicando scripts de InDesign ExtendScript (Glosario bidireccional)...', 'info');
        
        if (step >= 8) {
            clearInterval(interval);
            broadcast('✅ Compilación de EPUB y PDF finalizada con éxito.', 'success');
        }
    }, 1500); // Emite un log cada 1.5 segundos
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Motor Express escuchando en http://localhost:${PORT}`);
});