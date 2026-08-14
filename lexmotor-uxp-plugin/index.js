/**
 * Lexmotor UXP Plugin — Script Principal Unificado (G3.3.2)
 * Integración del StructuredDocumentExtractor, Carga Local del Mapa Canónico y CSS Canónico
 */
(function () {
    'use strict';

    // Importación del extractor estructural verificado por TDD (G3.2.1)
    const { extraerDocumentoEstructurado } = require('./src/extraction/StructuredDocumentExtractor');

    const estadoPanel = {
        status: 'IDLE',
        initializedAt: null,
        interactions: 0,
        filesystemTest: null,
        transportCapabilities: null,
        documentData: null,
        lastIpcResponse: null
    };

    function registrarTraza(fase, evento, detalle = {}) {
        const timestamp = new Date().toISOString();
        console.log(`[${fase}][${timestamp}] ${evento}`, JSON.stringify(detalle));
    }

    // ==========================================
    // SONDAS DE SISTEMA (G2.3 & G2.4)
    // ==========================================
    async function probarFilesystemUXP() {
        try {
            const fs = require('uxp').storage.localFileSystem;
            const tempFolder = await fs.getDataFolder();
            const file = await tempFolder.createFile(`lexmotor_fs_ping.txt`, { overwrite: true });
            await file.write("OK");
            return { status: 'GREEN' };
        } catch (e) { return { status: 'ERROR' }; }
    }
    async function sondearCapacidadesHost() { return { uxpProcess: false }; }

    // ==========================================
    // G3.2.1 — EXTRACCIÓN ESTRUCTURAL DEL DOM (AST)
    // ==========================================
    function extraerDocumentoRealEstructurado() {
        registrarTraza('G3.2.1', 'DOM_EXTRACTION_START');
        try {
            const indesign = require('indesign');
            const app = indesign.app;

            if (app.documents.length === 0) {
                const diag = { valid: false, message: 'No hay ningún documento activo en InDesign' };
                registrarTraza('G3.2.1', 'NO_ACTIVE_DOCUMENT', diag);
                return diag;
            }

            const doc = app.activeDocument;

            // Invocación del extractor estructural certificado (G3.2.1)
            const astEstructurado = extraerDocumentoEstructurado(doc);

            const data = {
                valid: true,
                metadata: {
                    name: doc.name,
                    storiesCount: doc.stories.length,
                    paragraphsCount: astEstructurado.fragmentos.length
                },
                content: astEstructurado
            };

            registrarTraza('G3.2.1', 'DOM_STRUCTURED_CONTENT_EXTRACTED', data.metadata);
            estadoPanel.documentData = data;
            return data;
        } catch (error) {
            registrarTraza('G3.2.1', 'DOM_EXTRACTION_ERROR', { message: error.message });
            return { valid: false, error: error.message };
        }
    }

    // ==========================================
    // SONDA G3.3.1-R1 — ACCESO AL SEMANTIC MAP CANÓNICO
    // ==========================================
    async function probarAccesoSemanticMap() {
        const fs = require('uxp').storage.localFileSystem;
        const url = 'file:///H:/LexDigital/Recursos/AUTOMATIZAR%20INDESIGN/proyecto-lexdigital_modular/estilos/fragmento.semantic_map.json';

        try {
            const entry = await fs.getEntryWithUrl(url);
            const contenido = await entry.read();

            registrarTraza('G3.3.1', 'SEMANTIC_MAP_ACCESS_OK', {
                name: entry.name,
                nativePath: entry.nativePath,
                length: contenido.length
            });

            return true;
        } catch (error) {
            registrarTraza('G3.3.1', 'SEMANTIC_MAP_ACCESS_ERROR', {
                message: error.message,
                url
            });

            return false;
        }
    }

    // ==========================================
    // G3.3.1-R2 — CARGA Y VALIDACIÓN DEL MAPA CANÓNICO LOCAL
    // ==========================================
    async function cargarSemanticMapCanonico() {
        const fs = require('uxp').storage.localFileSystem;

        registrarTraza('G3.3.1', 'SEMANTIC_MAP_LOAD_START');

        const pluginFolder = await fs.getPluginFolder();
        const sourceMapFile = await pluginFolder.getEntry('assets/fragmento.semantic_map.json');

        if (!sourceMapFile) {
            throw new Error('No existe assets/fragmento.semantic_map.json dentro del plugin');
        }

        const mapContent = await sourceMapFile.read();

        if (!mapContent || !mapContent.trim()) {
            throw new Error('El semantic map canónico está vacío');
        }

        // Validación de sintaxis estricta, sin transformar el contenido.
        JSON.parse(mapContent);

        registrarTraza('G3.3.1', 'SEMANTIC_MAP_LOAD_OK', {
            name: sourceMapFile.name,
            length: mapContent.length
        });

        return mapContent;
    }

    // ==========================================
    // G3.3.2 — CARGA Y VALIDACIÓN DEL CSS CANÓNICO LOCAL
    // ==========================================
    async function cargarCssCanonico() {
        const fs = require('uxp').storage.localFileSystem;

        registrarTraza('G3.3.2', 'CSS_LOAD_START');

        const pluginFolder = await fs.getPluginFolder();
        const sourceCssFile = await pluginFolder.getEntry('assets/fragmento.css');

        if (!sourceCssFile) {
            throw new Error('No existe assets/fragmento.css dentro del plugin');
        }

        const cssContent = await sourceCssFile.read();

        if (!cssContent || !cssContent.trim()) {
            throw new Error('El CSS canónico está vacío');
        }

        registrarTraza('G3.3.2', 'CSS_LOAD_OK', {
            name: sourceCssFile.name,
            length: cssContent.length
        });

        return cssContent;
    }
	
// ==========================================
    // FLUJO IPC E2E CON RECURSOS CANÓNICOS (G3.3.2)
    // ESTABILIZADO EN E11.5
    // ==========================================
    async function probarFlujoIPC(docData) {
        // Flag de instrumentación configurable
        const DEBUG_IPC = true; 
        
        const logIpc = (evento, detalle) => {
            if (DEBUG_IPC) registrarTraza('G3.3_IPC', evento, detalle);
        };

        logIpc('PAYLOAD_PREPARATION_START');
        try {
            const fs = require('uxp').storage.localFileSystem;
            const pluginData = await fs.getDataFolder();

            let ipcFolder, requestsDir, responsesDir, payloadsDir;
            try { ipcFolder = await pluginData.getEntry('ipc'); } catch (e) { ipcFolder = await pluginData.createFolder('ipc'); }
            try { requestsDir = await ipcFolder.getEntry('requests'); } catch (e) { requestsDir = await ipcFolder.createFolder('requests'); }
            try { responsesDir = await ipcFolder.getEntry('responses'); } catch (e) { responsesDir = await ipcFolder.createFolder('responses'); }
            try { payloadsDir = await ipcFolder.getEntry('payloads'); } catch (e) { payloadsDir = await pluginData.createFolder('payloads'); }

            // 1. Escritura del Input Estructurado Real (G3.2.1)
            const inputFile = await payloadsDir.createFile('input-real.json', { overwrite: true });
            await inputFile.write(JSON.stringify(docData.content, null, 2));

            // 2. Carga Local y Escritura del Semantic Map Canónico (G3.3.1)
            const semanticMapContent = await cargarSemanticMapCanonico();
            const mapFile = await payloadsDir.createFile('fragmento.semantic_map.json', { overwrite: true });
            await mapFile.write(semanticMapContent);
            logIpc('CANONICAL_SEMANTIC_MAP_WRITTEN_TO_PAYLOADS', { bytes: semanticMapContent.length });

            // 3. Carga Local y Escritura del CSS Canónico (G3.3.2)
            const cssContent = await cargarCssCanonico();
            const cssFile = await payloadsDir.createFile('fragmento.css', { overwrite: true });
            await cssFile.write(cssContent);
            logIpc('CANONICAL_CSS_WRITTEN_TO_PAYLOADS', { bytes: cssContent.length });

            const outputDir = await pluginData.getEntry('ipc');

            const requestId = 'req-uxp-' + Date.now();
            const payload = {
                protocolVersion: '1.0',
                requestId: requestId,
                command: 'compile',
                input: inputFile.nativePath,
                semanticMap: mapFile.nativePath,
                css: cssFile.nativePath,
                output: outputDir.nativePath
            };

            const reqFile = await requestsDir.createFile(`request-${requestId}.json`, { overwrite: true });
            await reqFile.write(JSON.stringify(payload));
            
            const ipcWriteTime = performance.now();
            registrarTraza('G2.6', 'IPC_WRITE_REQUEST_WITH_CANONICAL_RESOURCES', { requestId });

            let responseFile = null;
            
            // CONFIGURACIÓN DE TIMEOUT PRODUCTIVO (10 segundos max)
            const maxIntentos = 40;
            const intervaloMs = 250; 

            for (let i = 0; i < maxIntentos; i++) {
                await new Promise(resolve => setTimeout(resolve, intervaloMs));
                try {
                    // Validamos explícitamente que la respuesta coincida con nuestro requestId
                    responseFile = await responsesDir.getEntry(`response-${requestId}.json`);
                    if (responseFile) {
                        const elapsed = ((performance.now() - ipcWriteTime) / 1000).toFixed(2);
                        logIpc('IPC_RESPONSE_FOUND_IN_DISK', { elapsedSeconds: elapsed, attempt: i + 1 });
                        break;
                    }
                } catch (e) {
                    // El archivo aún no existe, seguimos sondeando silenciosamente
                }
            }

            if (!responseFile) {
                const totalElapsed = ((performance.now() - ipcWriteTime) / 1000).toFixed(2);
                registrarTraza('G2.6', 'IPC_TIMEOUT', { timeoutMs: maxIntentos * intervaloMs, elapsedSeconds: totalElapsed });
                throw new Error(`Timeout IPC tras ${totalElapsed}s`);
            }

            const responseRaw = await responseFile.read();
            const response = JSON.parse(responseRaw);
            
            // Limpieza higiénica inmediata del archivo de respuesta
            try { await responseFile.delete(); } catch (e) { logIpc('CLEANUP_WARN', { msg: 'No se pudo borrar response' }); }

            // Validación de Contrato de Error (E11.4-B)
            if (response.success === false) {
                registrarTraza('G2.6', 'IPC_COMPILATION_ERROR', { error: response.error });
                throw new Error(response.error || "Fallo desconocido en Node.js");
            }

            registrarTraza('G2.6', 'IPC_RESPONSE_RECEIVED', { 
                requestId: response.requestId, 
                success: response.success 
            });
            
            estadoPanel.lastIpcResponse = response;
            return response;
            
        } catch (error) {
            registrarTraza('G2.6', 'IPC_TEST_ERROR', { message: error.message });
            return { success: false, error: error.message }; // Normalizamos la salida de error
        }
    }

    // ==========================================
    // INICIALIZACIÓN DEL PANEL
    // ==========================================
    function inicializarPanel() {
        estadoPanel.initializedAt = new Date().toISOString();
        estadoPanel.status = 'IDLE';
        registrarTraza('G2.2', 'PANEL_INITIALIZED');

        const btnProbar = document.getElementById('btnProbar');
        if (btnProbar) {
            btnProbar.addEventListener('click', async () => {
                estadoPanel.interactions++;
                
                btnProbar.textContent = "Extrayendo AST...";
                btnProbar.style.backgroundColor = '#FF9800';
                btnProbar.style.color = '#fff';

                await probarFilesystemUXP();
                await sondearCapacidadesHost();
                
                // Extracción estructurada del DOM
                const docData = extraerDocumentoRealEstructurado();

		if (docData && docData.valid) {
                    btnProbar.textContent = "Compilando AST...";
                    const ipcResult = await probarFlujoIPC(docData);
                    
                    if (ipcResult && ipcResult.success) {
                        registrarTraza('G1.3', 'UXP_FEEDBACK_HANDOFF', { status: 'SUCCESS' });
                        btnProbar.textContent = `COMPLETADO`;
                        btnProbar.style.backgroundColor = '#4CAF50';
                    } else {
                        // Mostramos en consola el error que interceptó el watcher
                        console.error("Fallo de IPC/Compilación:", ipcResult ? ipcResult.error : "Desconocido");
                        btnProbar.textContent = "ERROR IPC/COMPILACIÓN";
                        btnProbar.style.backgroundColor = '#F44336';
                    }
                }

                setTimeout(() => {
                    btnProbar.textContent = "Probar Estado Panel";
                    btnProbar.style.backgroundColor = '';
                    btnProbar.style.color = '';
                }, 5000);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarPanel);
    } else {
        inicializarPanel();
    }
})();