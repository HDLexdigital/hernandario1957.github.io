'use strict';

const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

// Permite inyectar un directorio temporal para pruebas, o usa el de InDesign por defecto.
const ipcDir = process.env.LEXMOTOR_IPC_DIR || "C:\\Users\\PC\\AppData\\Roaming\\Adobe\\UXP\\PluginsStorage\\IDSN\\21\\Developer\\com.lexmotor.uxp\\PluginData\\ipc";
const requestsDir = path.join(ipcDir, 'requests');
const responsesDir = path.join(ipcDir, 'responses');

// Asegurar que las carpetas existen
if (!fs.existsSync(requestsDir)) fs.mkdirSync(requestsDir, { recursive: true });
if (!fs.existsSync(responsesDir)) fs.mkdirSync(responsesDir, { recursive: true });

console.log('============================================================');
console.log('       PUENTE IPC LEXDIGITAL <-> INDESIGN ACTIVO (MODO PRUEBA)');
console.log('============================================================');
console.log(`Vigilando: ${requestsDir}`);
console.log('Esperando peticiones desde UXP...\n');

const watcher = chokidar.watch(requestsDir, {
    ignored: /(^|[\/\\])\../, 
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 }
});

watcher.on('add', async (filePath) => {
    const fileName = path.basename(filePath);
    if (!fileName.startsWith('request-req-uxp-') || !fileName.endsWith('.json')) return;

    const requestId = fileName.replace('request-', '').replace('.json', '');
    console.log(`\n✅ [IPC] PETICIÓN RECIBIDA DESDE INDESIGN (id=${requestId})`);

try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const payload = JSON.parse(fileContent);
        
        // 1. Importar tu orquestador y adaptador E10 dinámicamente
        const { compilarLexmotor } = require('./src/index');
        const { adaptarInDesign } = require('./src/adaptadores/InDesignAdapter');

        // 2. Leer recursos
        const inputData = JSON.parse(fs.readFileSync(payload.input, 'utf-8'));
        const semanticMap = payload.semanticMap ? JSON.parse(fs.readFileSync(payload.semanticMap, 'utf-8')) : null;
        
        console.log(`[IPC] COMPILATION_START`);
        
        // 3. Fase 0: Adaptación E10 (Sin condicionales, siempre adaptamos)
        console.log(`[IPC] ADAPTANDO ESTRUCTURA INDESIGN A LEXDIGITAL...`);
        const adaptacion = adaptarInDesign({ jsonCrudo: inputData, semanticMap });
        const jsonNormalizado = adaptacion.ast;

        // 4. Fases 1 a 4: Compilar Lexmotor
        const resultado = await compilarLexmotor(
            jsonNormalizado,
            'InDesign_Export',
            payload.css || 'estilos.css'
        );

        console.log(`[IPC] COMPILATION_COMPLETE id=${requestId}`);

        // 5. Escribir la respuesta
        const responseData = {
            success: true,
            requestId: requestId,
            timestamp: new Date().toISOString(),
            result: resultado
        };

        const responsePath = path.join(responsesDir, `response-${requestId}.json`);
        fs.writeFileSync(responsePath, JSON.stringify(responseData, null, 2), 'utf-8');
        
        console.log(`🚀 [IPC] RESPUESTA ENVIADA EN MILISEGUNDOS`);
        fs.unlinkSync(filePath);

    } catch (error) {
        // ... (el bloque catch se queda igual que en tu versión original)
        console.error(`[IPC] COMPILATION_ERROR id=${requestId}`);
        console.error(error);

        const responsePath = path.join(responsesDir, `response-${requestId}.json`);
        fs.writeFileSync(responsePath, JSON.stringify({ success: false, requestId, error: error.message }, null, 2), 'utf-8');
        try { fs.unlinkSync(filePath); } catch(e){} 
    }
});