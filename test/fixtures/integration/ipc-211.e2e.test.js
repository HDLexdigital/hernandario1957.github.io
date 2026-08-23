'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

describe('E11.4 â€” Test E2E del Puente IPC (CorrelaciÃ³n y Ciclo de vida)', () => {

    const TEST_TIMEOUT_MS = 5000;
    const POLLING_INTERVAL_MS = 100;
    
    // Directorios aislados para la prueba E2E
    const baseTestDir = path.join(__dirname, '../temp_ipc');
    const requestsDir = path.join(baseTestDir, 'requests');
    const responsesDir = path.join(baseTestDir, 'responses');
    
    // Rutas absolutas a los fixtures crudos reales
    const rawFixturePath = path.join(__dirname, '../raw/fragmento-211.json');
    
    // Identificador Ãºnico para esta ejecuciÃ³n E2E (Camino Feliz)
    const uniqueId = Date.now().toString();
    const requestId = `req-uxp-test-${uniqueId}`;
    const requestFileName = `request-${requestId}.json`;
    const responseFileName = `response-${requestId}.json`;
    
    const requestPath = path.join(requestsDir, requestFileName);
    const responsePath = path.join(responsesDir, responseFileName);

    let watcherProcess;

    beforeAll((done) => {
        if (fs.existsSync(baseTestDir)) fs.rmSync(baseTestDir, { recursive: true, force: true });
        fs.mkdirSync(requestsDir, { recursive: true });
        fs.mkdirSync(responsesDir, { recursive: true });

        // CorrecciÃ³n de la ruta: subimos tres niveles desde test/fixtures/integration/
	const watcherScript = path.join(
		__dirname,
		'../../../scripts/diagnosticos/watcher-ipc.js'
	);        
        watcherProcess = spawn('node', [watcherScript], {
            env: { ...process.env, LEXMOTOR_IPC_DIR: baseTestDir }
        });

        // Â¡CRÃTICO PARA DIAGNÃ“STICO! Imprimimos en la consola lo que el watcher estÃ¡ diciendo
        watcherProcess.stdout.on('data', (data) => console.log(`[WATCHER] ${data.toString().trim()}`));
        watcherProcess.stderr.on('data', (data) => console.error(`[WATCHER ERROR] ${data.toString().trim()}`));

        // Escuchar si el proceso crashea prematuramente
        watcherProcess.on('close', (code) => {
            if (code !== 0 && code !== null) {
                console.error(`[WATCHER ERROR] El proceso del watcher se cerrÃ³ inesperadamente con cÃ³digo ${code}`);
            }
        });

        setTimeout(done, 500);
    });

    afterAll(() => {
        // 3. Matar el proceso y limpiar la basura temporal
        if (watcherProcess) watcherProcess.kill('SIGKILL');
        if (fs.existsSync(baseTestDir)) fs.rmSync(baseTestDir, { recursive: true, force: true });
    });

    test('A. Camino Feliz: debe procesar una peticiÃ³n IPC real, retornar respuesta correlacionada y auto-limpiarse', async () => {
        // A. Preparar el payload del Request apuntando al RAW real
        const requestPayload = {
            command: "compile",
            input: rawFixturePath, // Inyectamos la ruta absoluta dinÃ¡mica
            css: "fragmento-test.css"
        };

        // B. Disparar el flujo escribiendo el archivo en la carpeta de requests
        fs.writeFileSync(requestPath, JSON.stringify(requestPayload, null, 2), 'utf-8');

        // C. Esperar la respuesta (Polling)
        let responseFound = false;
        let responseContent = null;
        let elapsed = 0;

        while (!responseFound && elapsed < TEST_TIMEOUT_MS) {
            if (fs.existsSync(responsePath)) {
                responseFound = true;
                responseContent = JSON.parse(fs.readFileSync(responsePath, 'utf-8'));
                break;
            }
            await new Promise(r => setTimeout(r, POLLING_INTERVAL_MS));
            elapsed += POLLING_INTERVAL_MS;
        }

        // VERIFICACIONES DEL CONTRATO IPC

        // 1. Transporte: La respuesta llegÃ³ antes del timeout
        expect(responseFound).toBe(true);
        
        // 2. CorrelaciÃ³n: El requestId devuelto coincide exactamente con el enviado
        expect(responseContent.requestId).toBe(requestId);
        
        // --- AÃ‘ADE ESTO PARA VER EL ERROR REAL ---
        if (!responseContent.success) {
            console.error("\nðŸ’¥ [DIAGNÃ“STICO E2E] El watcher devolviÃ³ un error controlado:");
            console.error(responseContent.error, "\n");
        }
        // -----------------------------------------

        // 3. Ã‰xito LÃ³gico: El sistema no colapsÃ³ internamente
        if (responseContent.success !== true) {
            throw new Error(`\n\nðŸ’¥ EL WATCHER FALLÃ“. Error devuelto por IPC:\n"${responseContent.error}"\n\n`);
        }
        expect(responseContent.timestamp).toBeDefined();
        
        // 4. Integridad del Dominio: La respuesta incluye el XHTML procesado
        expect(responseContent.result).toBeDefined();
        expect(responseContent.result.xhtml).toBeDefined();
        expect(typeof responseContent.result.xhtml).toBe('string');
        
        // 5. Ciclo de Vida: El request original FUE ELIMINADO
        expect(fs.existsSync(requestPath)).toBe(false);
        
    }, TEST_TIMEOUT_MS + 1000); // Timeout total del test ligeramente superior al bucle

    test('B. Camino de Error: debe capturar excepciones, retornar success=false y auto-limpiarse', async () => {
        // Generamos un ID y rutas independientes para este test
        const errorUniqueId = Date.now().toString();
        const errorRequestId = `req-uxp-test-error-${errorUniqueId}`;
        const errorRequestPath = path.join(requestsDir, `request-${errorRequestId}.json`);
        const errorResponsePath = path.join(responsesDir, `response-${errorRequestId}.json`);

        // A. Preparar un payload venenoso (ruta que no existe para forzar ENOENT en fs.readFileSync)
        const requestPayload = {
            command: "compile",
            input: path.join(__dirname, '../raw/archivo-fantasma-inexistente.json'), 
            css: "fragmento-test.css"
        };

        // B. Disparar el flujo
        fs.writeFileSync(errorRequestPath, JSON.stringify(requestPayload, null, 2), 'utf-8');

        // C. Esperar la respuesta (Polling)
        let responseFound = false;
        let responseContent = null;
        let elapsed = 0;

        while (!responseFound && elapsed < TEST_TIMEOUT_MS) {
            if (fs.existsSync(errorResponsePath)) {
                responseFound = true;
                responseContent = JSON.parse(fs.readFileSync(errorResponsePath, 'utf-8'));
                break;
            }
            await new Promise(r => setTimeout(r, POLLING_INTERVAL_MS));
            elapsed += POLLING_INTERVAL_MS;
        }

        // VERIFICACIONES DEL CONTRATO IPC EN CAMINO DE ERROR

        // 1. Transporte: La respuesta de error llegÃ³ antes del timeout
        expect(responseFound).toBe(true);
        
        // 2. CorrelaciÃ³n: El requestId del error coincide exactamente con el enviado
        expect(responseContent.requestId).toBe(errorRequestId);
        
        // 3. Manejo de Fallo: El watcher no muriÃ³, pero informa que fallÃ³ la operaciÃ³n
        expect(responseContent.success).toBe(false);
        
        // 4. DiagnÃ³stico: Incluye el mensaje de error para que UXP pueda mostrarlo
        expect(responseContent.error).toBeDefined();
        expect(typeof responseContent.error).toBe('string');
        expect(responseContent.error.length).toBeGreaterThan(0);
        
        // 5. Ciclo de Vida: El request original venenoso TAMBIÃ‰N FUE ELIMINADO
        expect(fs.existsSync(errorRequestPath)).toBe(false);
        
    }, TEST_TIMEOUT_MS + 1000);

});

