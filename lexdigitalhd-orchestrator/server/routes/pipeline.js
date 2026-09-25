// server/routes/pipeline.js (o dentro de server.js)
const express = require('express');
const router = express.Router();
const { broadcast } = require('../services/sseManager');
const { runProcess } = require('../services/processRunner');
const path = require('path');

router.post('/start', async (req, res) => {
    // 1. Responder rápido para liberar el hilo de UI
    res.json({ status: 'Pipeline de LexDigitalHD iniciado' });
    
    broadcast('🚀 Iniciando orquestación de textos legales...', 'info');

    try {
        // 2. Definir rutas absolutas (evita problemas de rutas relativas al ejecutar comandos)
        const rootDir = path.resolve(__dirname, '../../');
        const pythonScript = path.join(rootDir, 'workers/python/procesar_esquema.py');
        const bashScript = path.join(rootDir, 'workers/bash/lanzar_indesign.sh');

        // 3. Ejecutar los procesos de forma SECUENCIAL (uno tras otro)
        
        // FASE A: Ingesta y validación con Node/Python
        await runProcess('python3', [pythonScript, '--strict'], 'Python Data Prep');
        
        // FASE B: Desplegar rutinas de InDesign (ExtendScript)
        // Como InDesign corre en Windows, este script Bash podría usar VBoxManage o SSH 
        // para lanzar el .jsx en la máquina virtual o partición de Windows.
        await runProcess('bash', [bashScript], 'ExtendScript / UXP Deploy');

        // Si todo sale bien (las promesas se resuelven)
        broadcast('🎉 Pipeline completado: El documento cumple los estándares WCAG/EPUB3.', 'success');

    } catch (error) {
        // Si cualquier runProcess rechaza la promesa, caemos aquí y detenemos la cadena
        broadcast(`🛑 Pipeline abortado por un error en un subproceso.`, 'error');
    }
});

module.exports = router;