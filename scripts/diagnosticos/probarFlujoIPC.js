// ==========================================
    // FLUJO IPC E2E CON RECURSOS CANÓNICOS (G3.3.2) - INSTRUMENTADO
    // ==========================================
    async function probarFlujoIPC(docData) {
        const tGlobalStart = performance.now();
        registrarTraza('G3.3', 'PAYLOAD_PREPARATION_START');
        
        try {
            const fs = require('uxp').storage.localFileSystem;
            const pluginData = await fs.getDataFolder();

            let ipcFolder, requestsDir, responsesDir, payloadsDir;
            try { ipcFolder = await pluginData.getEntry('ipc'); } catch (e) { ipcFolder = await pluginData.createFolder('ipc'); }
            try { requestsDir = await ipcFolder.getEntry('requests'); } catch (e) { requestsDir = await ipcFolder.createFolder('requests'); }
			registrarTraza('G2.6', 'RUTA_SECRETA_UXP', { ruta: requestsDir.nativePath });
            try { responsesDir = await ipcFolder.getEntry('responses'); } catch (e) { responsesDir = await ipcFolder.createFolder('responses'); }
            try { payloadsDir = await ipcFolder.getEntry('payloads'); } catch (e) { payloadsDir = await ipcFolder.createFolder('payloads'); }
			console.log(">>>>> RUTA IPC SECRETA DE UXP:", requestsDir.nativePath);
			
            // T0: Inicio de preparación y serialización del input estructurado
            const t0SerialStart = performance.now();
            registrarTraza('G3.3', 'JSON_SERIALIZATION_START');
            
            const inputStringified = JSON.stringify(docData.content, null, 2);
            const t1SerialEnd = performance.now();
            registrarTraza('G3.3', 'JSON_SERIALIZATION_END', { durationMs: (t1SerialEnd - t0SerialStart).toFixed(2), length: inputStringified.length });

            const inputFile = await payloadsDir.createFile('input-real.json', { overwrite: true });
            await inputFile.write(inputStringified);

            // Carga y escritura del Semantic Map Canónico
            const semanticMapContent = await cargarSemanticMapCanonico();
            const mapFile = await payloadsDir.createFile('fragmento.semantic_map.json', { overwrite: true });
            await mapFile.write(semanticMapContent);
            registrarTraza('G3.3', 'CANONICAL_SEMANTIC_MAP_WRITTEN_TO_PAYLOADS', { bytes: semanticMapContent.length });

            // Carga y escritura del CSS Canónico
            const cssContent = await cargarCssCanonico();
            const cssFile = await payloadsDir.createFile('fragmento.css', { overwrite: true });
            await cssFile.write(cssContent);
            registrarTraza('G3.3.2', 'CANONICAL_CSS_WRITTEN_TO_PAYLOADS', { bytes: cssContent.length });

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

            const payloadStringified = JSON.stringify(payload);

            // T0 de Escritura de Request
            const t0WriteStart = performance.now();
            registrarTraza('G3.3', 'IPC_WRITE_START', { requestId });

            const reqFile = await requestsDir.createFile(`request-${requestId}.json`, { overwrite: true });
            await reqFile.write(payloadStringified);

            // T1: Escritura completada en disco
            const t1WriteComplete = performance.now();
            registrarTraza('G3.3', 'IPC_WRITE_COMPLETE', { durationMs: (t1WriteComplete - t0WriteStart).toFixed(2) });
            registrarTraza('G2.6', 'IPC_WRITE_REQUEST_WITH_CANONICAL_RESOURCES', { requestId });

            // T2: Inicio de espera de respuesta (Sondeo / Polling)
            registrarTraza('G3.3', 'IPC_RESPONSE_WAIT_START');
            
            let responseFile = null;
            const maxIntentos = 30;
            const intervaloMs = 1000;
            let t2FileDetected = null;

            for (let i = 0; i < maxIntentos; i++) {
                await new Promise(resolve => setTimeout(resolve, intervaloMs));
                try {
                    responseFile = await responsesDir.getEntry(`response-${requestId}.json`);
                    if (responseFile) {
                        t2FileDetected = performance.now();
                        registrarTraza('G2.6', 'IPC_RESPONSE_FOUND_IN_DISK', { 
                            waitDurationMs: (t2FileDetected - t1WriteComplete).toFixed(2), 
                            attempt: i + 1 
                        });
                        break;
                    }
                } catch (e) { }
            }

            if (!responseFile) {
                const totalElapsed = ((performance.now() - t0WriteStart) / 1000).toFixed(2);
                throw new Error(`Timeout IPC tras ${totalElapsed}s sin respuesta del receptor`);
            }

            // T3: Lectura y parseo de la respuesta recibida
            const t3ResponseReadStart = performance.now();
            const responseRaw = await responseFile.read();
            const response = JSON.parse(responseRaw);
            const t3ResponseReadEnd = performance.now();

            registrarTraza('G3.3', 'IPC_RESPONSE_RECEIVED', { 
                readDurationMs: (t3ResponseReadEnd - t3ResponseReadStart).toFixed(2) 
            });

            const tGlobalEnd = performance.now();
            registrarTraza('G3.3', 'G3.3_COMPLETE', { 
                totalDurationSeconds: ((tGlobalEnd - tGlobalStart) / 1000).toFixed(2),
                metricsBreakdown: {
                    serializationMs: (t1SerialEnd - t0SerialStart).toFixed(2),
                    writeMs: (t1WriteComplete - t0WriteStart).toFixed(2),
                    pollWaitMs: (t2FileDetected - t1WriteComplete).toFixed(2),
                    readParseMs: (t3ResponseReadEnd - t3ResponseReadStart).toFixed(2)
                }
            });

            estadoPanel.lastIpcResponse = response;
            return response;

        } catch (error) {
            registrarTraza('G2.6', 'IPC_TEST_ERROR', { message: error.message });
            return null;
        }
    }