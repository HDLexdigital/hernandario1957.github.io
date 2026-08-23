/**
 * Lexmotor UXP Plugin — Script Principal Unificado (G3.3.2 + E17.4)
 * Integración de AST, CSS Canónico, y Heartbeat Atómico IPC (Lifecycle)
 * [INSTRUMENTADO PARA IPC-TM-002: RUTAS ABSOLUTAS Y PERSISTENCIA]
 */
(function () {
    'use strict';

    // Importación del extractor estructural (G3.2.1) y del nuevo extractor semántico dinámico (G3.3.1)
    const { extraerDocumentoEstructurado } = require('./src/extraction/StructuredDocumentExtractor');
    const { extraerMapaSemantico } = require('./src/extraction/SemanticMapExtractor');

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
    // E17.4-A — MÁQUINA DE ESTADOS UXP (HEARTBEAT ATÓMICO)
    // ==========================================
    const sessionInstanceId = 'uxp-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    let heartbeatIntervalId = null;

    async function iniciarHeartbeatIPC() {
        try {
            const os = require('os');
            const fs = require('uxp').storage.localFileSystem;

            // 1. Resolver Directorios (Rendezvous Point)
            const platform = os.platform();
            const homedir = os.homedir();
            const uriPrefix = platform === 'win32' ? 'file:///' : 'file://';
            const homeUrl = uriPrefix + homedir.replace(/\\/g, '/');

            const homeFolder = await fs.getEntryWithUrl(homeUrl);
            
            let lexdigitalFolder;
            try { lexdigitalFolder = await homeFolder.getEntry('.lexdigital'); } 
            catch (e) { lexdigitalFolder = await homeFolder.createFolder('.lexdigital'); }

            const pluginData = await fs.getDataFolder();
            let ipcFolder;
            try { ipcFolder = await pluginData.getEntry('ipc'); } 
            catch (e) { ipcFolder = await pluginData.createFolder('ipc'); }

            // 2. Función de Latido (Escritura Atómica)
            const emitirLatido = async () => {
                try {
                    const payload = {
                        protocolVersion: "1.0",
                        ipcRoot: ipcFolder.nativePath,
                        instanceId: sessionInstanceId,
                        updatedAt: estadoPanel.initializedAt,
                        heartbeatAt: new Date().toISOString()
                    };

                    // Paso A: Escritura en archivo temporal (.tmp)
                    const tmpFile = await lexdigitalFolder.createFile('active-ipc-root.tmp.json', { overwrite: true });
                    await tmpFile.write(JSON.stringify(payload, null, 2));

                    // 🔎 INSTRUMENTACIÓN IPC-TM-002: Volcado de Ruta Absoluta del Heartbeat
                    console.log("IPC_TM002_HEARTBEAT_WRITE_PATH (Folder): " + lexdigitalFolder.nativePath);
                    console.log("IPC_TM002_HEARTBEAT_WRITE_PATH (File): " + tmpFile.nativePath);

                    // Paso B: Renombrado atómico al archivo final
                    await tmpFile.moveTo(lexdigitalFolder, { overwrite: true, newName: 'active-ipc-root.json' });

                } catch (err) {
                    // Silencioso en producción, pero útil si se requiere depurar colisiones
                }
            };

            // 3. Emitir el contrato inmediatamente y programar bucle
            await emitirLatido();
            if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
            heartbeatIntervalId = setInterval(emitirLatido, 3000);
            
            registrarTraza('E17.4', 'HEARTBEAT_STARTED', { instanceId: sessionInstanceId, intervalMs: 3000 });

        } catch (error) {
            console.error("\n--- [E17.4 FATAL] FALLO AL INICIAR RENDEZVOUS ---");
            console.error("Mensaje:", error.message);
            console.error("---------------------------------------------------\n");
        }
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
    // G3.2.1 — EXTRACCIÓN ESTRUCTURAL DEL DOM (AST) Y MAPA SEMÁNTICO
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

            const astEstructurado = extraerDocumentoEstructurado(doc);
            const mapaSemanticoDinamico = extraerMapaSemantico(doc);

            const data = {
                valid: true,
                metadata: {
                    name: doc.name,
                    storiesCount: doc.stories.length,
                    paragraphsCount: astEstructurado.fragmentos.length
                },
                content: astEstructurado,
                semanticMap: mapaSemanticoDinamico
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

        registrarTraza('G3.3.2', 'CSS_LOAD_OK', { name: sourceCssFile.name, length: cssContent.length });
        return cssContent;
    }
    
    // ==========================================
    // FLUJO IPC E2E CON RECURSOS CANÓNICOS (G3.3.2) + IPC-TM-002
    // ==========================================
    async function probarFlujoIPC(docData) {
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
            try { payloadsDir = await ipcFolder.getEntry('payloads'); } catch (e) { payloadsDir = await ipcFolder.createFolder('payloads'); }

            // 1. Escritura del Input Estructurado Real (G3.2.1)
            const inputFile = await payloadsDir.createFile('input-real.json', { overwrite: true });
            await inputFile.write(JSON.stringify(docData.content, null, 2));

            // 2.5 Escritura del Semantic Map Dinámico
            const mapDinamicoFile = await payloadsDir.createFile('fragmento.semantic_map.dynamic.json', { overwrite: true });
            await mapDinamicoFile.write(JSON.stringify(docData.semanticMap, null, 2));
            logIpc('DYNAMIC_SEMANTIC_MAP_WRITTEN_TO_PAYLOADS', { name: mapDinamicoFile.name });

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
                semanticMap: mapDinamicoFile.nativePath,
                css: cssFile.nativePath,
                output: outputDir.nativePath
            };

            const reqFile = await requestsDir.createFile(`request-${requestId}.json`, { overwrite: true });
            
            // 🔎 INSTRUMENTACIÓN IPC-TM-002: Volcado de Ruta Absoluta del Request IPC
            console.log("IPC_TM002_WRITE_PATH (Requests Folder): " + requestsDir.nativePath);
            console.log("IPC_TM002_WRITE_PATH (Request File): " + reqFile.nativePath);
            console.log("IPC_TM002_REQUEST_CREATED id:", requestId);

            await reqFile.write(JSON.stringify(payload));
            
            const ipcWriteTime = performance.now();
            registrarTraza('G2.6', 'IPC_WRITE_REQUEST_WITH_CANONICAL_RESOURCES', { requestId });

            let responseFile = null;
            const maxIntentos = 40;
            const intervaloMs = 250; 

            for (let i = 0; i < maxIntentos; i++) {
                await new Promise(resolve => setTimeout(resolve, intervaloMs));
                try {
                    responseFile = await responsesDir.getEntry(`response-${requestId}.json`);
                    if (responseFile) {
                        const elapsed = ((performance.now() - ipcWriteTime) / 1000).toFixed(2);
                        logIpc('IPC_RESPONSE_FOUND_IN_DISK', { elapsedSeconds: elapsed, attempt: i + 1 });
                        break;
                    }
                } catch (e) {
                    // Esperando respuesta...
                }
            }

            if (!responseFile) {
                const totalElapsed = ((performance.now() - ipcWriteTime) / 1000).toFixed(2);
                registrarTraza('G2.6', 'IPC_TIMEOUT', { timeoutMs: maxIntentos * intervaloMs, elapsedSeconds: totalElapsed });
                throw new Error(`Timeout IPC tras ${totalElapsed}s`);
            }

            const responseRaw = await responseFile.read();
            const response = JSON.parse(responseRaw);
            
            try { await responseFile.delete(); } catch (e) { logIpc('CLEANUP_WARN', { msg: 'No se pudo borrar response' }); }

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
            return { success: false, error: error.message };
        }
    }

    // ==========================================
    // INICIALIZACIÓN DEL PANEL
    // ==========================================
    function inicializarPanel() {
        estadoPanel.initializedAt = new Date().toISOString();
        estadoPanel.status = 'IDLE';
        registrarTraza('G2.2', 'PANEL_INITIALIZED');

        iniciarHeartbeatIPC();

        const btnProbar = document.getElementById('btnProbar');
        if (btnProbar) {
            btnProbar.addEventListener('click', async () => {
                estadoPanel.interactions++;
                
                btnProbar.textContent = "Extrayendo AST...";
                btnProbar.style.backgroundColor = '#FF9800';
                btnProbar.style.color = '#fff';

                await probarFilesystemUXP();
                await sondearCapacidadesHost();
                
                const docData = extraerDocumentoRealEstructurado();

                if (docData && docData.valid) {
                    btnProbar.textContent = "Compilando AST...";
                    const ipcResult = await probarFlujoIPC(docData);
                    
                    if (ipcResult && ipcResult.success) {
                        registrarTraza('G1.3', 'UXP_FEEDBACK_HANDOFF', { status: 'SUCCESS' });
                        btnProbar.textContent = `COMPLETADO`;
                        btnProbar.style.backgroundColor = '#4CAF50';
                    } else {
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