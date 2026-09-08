'use strict';

const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

// ==========================================
// RUTA RAÍZ ABSOLUTA DEL PROYECTO (H:)
// ==========================================
const PROYECTO_ROOT = "H:\\LexDigital\\Recursos\\AUTOMATIZAR INDESIGN\\proyecto-lexdigital_modular";

// Permite inyectar un directorio temporal para pruebas, o usa el de InDesign por defecto.
const ipcDir = process.env.LEXMOTOR_IPC_DIR || "C:\\Users\\PC\\AppData\\Roaming\\Adobe\\UXP\\PluginsStorage\\IDSN\\21\\Developer\\com.lexmotor.uxp\\PluginData\\ipc";
const requestsDir = path.join(ipcDir, 'requests');
const responsesDir = path.join(ipcDir, 'responses');

// Asegurar que las carpetas existen
if (!fs.existsSync(requestsDir)) fs.mkdirSync(requestsDir, { recursive: true });
if (!fs.existsSync(responsesDir)) fs.mkdirSync(responsesDir, { recursive: true });

// ==========================================
// FUNCIÓN FORENSE: Auditoría de Colisiones (Cierre E13)
// ==========================================
function auditarColisionesSemanticas(styleBridge) {
    if (!styleBridge) return [];
    
    const mapaClases = {};
    const colisiones = [];

    for (const [estiloInDesign, puente] of Object.entries(styleBridge)) {
        const clase = puente.className;
        if (!clase) continue;

        if (!mapaClases[clase]) {
            mapaClases[clase] = [];
        }
        mapaClases[clase].push(estiloInDesign);
    }

    // Evaluar si una misma clase está siendo ocupada por más de un estilo
    for (const [clase, estilos] of Object.entries(mapaClases)) {
        if (estilos.length > 1) {
            colisiones.push({ clase, estilosOrigen: estilos });
        }
    }

    if (colisiones.length > 0) {
        console.warn(`\n⚠️ [E13 CIERRE FORENSE] COLISIONES SEMÁNTICAS DETECTADAS:`);
        colisiones.forEach(c => {
            console.warn(`  La clase semántica ".${c.clase}" está siendo ocupada por: ${c.estilosOrigen.join(' y ')}`);
            console.warn(`  -> Riesgo: El CSS en cascada sobreescribirá las propiedades del primero.`);
        });
        console.warn(`--------------------------------------------------------------------\n`);
    } else {
        console.log(`\n✅ [E13 CIERRE FORENSE] Cero colisiones semánticas. Mapeo 1:1 garantizado.\n`);
    }

    return colisiones;
}

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
        
        // 1. Importar tu orquestador, adaptador E10 y el purificador de CSS (RUTAS CORREGIDAS)
        const { compilarLexmotor } = require('../../src/index');
        const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
        const { purgarCSSInDesign } = require('../../src/utils/cssPurifier');

        // 2. Leer recursos
        const inputData = JSON.parse(fs.readFileSync(payload.input, 'utf-8'));
        const semanticMap = payload.semanticMap ? JSON.parse(fs.readFileSync(payload.semanticMap, 'utf-8')) : null;
        
        if (semanticMap && semanticMap.styles) {
            console.log("\n🔍 [E13.2 DICTAMEN] INSPECCIONANDO BLOQUE PRESENTATION EN ESTILOS:");
            // Muestra los primeros 3 estilos del documento real como muestra de evidencia
            semanticMap.styles.slice(0, 3).forEach(s => {
                console.log(`- Estilo: [${s.type}] ${s.originalName}`);
                console.log(`  Tag EPUB:`, s.exportTagging && s.exportTagging.epub ? s.exportTagging.epub.tag : 'N/A');
                console.log(`  Presentation:`, JSON.stringify(s.presentation));
            });
            console.log("--------------------------------------------------------------\n");
        }

        // ==========================================
        // GUARDAR COPIA DEL JSON CRUDO (MisJSON)
        // ==========================================
        const carpetaMisJSON = path.join(PROYECTO_ROOT, 'MisJSON');
        if (!fs.existsSync(carpetaMisJSON)) fs.mkdirSync(carpetaMisJSON, { recursive: true });
        fs.writeFileSync(path.join(carpetaMisJSON, `input_${requestId}.json`), JSON.stringify(inputData, null, 2), 'utf-8');

        console.log(`[IPC] COMPILATION_START`);
        
        // ==========================================
        // 3. FASE 0: ADAPTACIÓN E10 Y ETRACCIÓN DE PUENTE (ANTES DEL CSS)
        // ==========================================
        console.log(`[IPC] ADAPTANDO ESTRUCTURA INDESIGN A LEXDIGITAL...`);
        const adaptacion = adaptarInDesign({ jsonCrudo: inputData, semanticMap });
        const jsonNormalizado = adaptacion.ast;
        const styleBridge = adaptacion.styleBridge; // <-- E13.4 EXTRAEMOS EL PUENTE
        
        // --- CIERRE FORENSE E13: AUDITORÍA DE COLISIONES ---
        auditarColisionesSemanticas(styleBridge);
        
        // --- SONDA DE VERIFICACIÓN E13.3 ---
        if (jsonNormalizado && jsonNormalizado.contenido) {
            console.log("🔎 [E13.3 VERIFICACIÓN AST] INSPECCIONANDO RESOLVED PRESENTATION:");
            const nodosConPresentacion = jsonNormalizado.contenido.filter(n => n.resolvedPresentation && Object.keys(n.resolvedPresentation).length > 0);
            if (nodosConPresentacion.length > 0) {
                nodosConPresentacion.slice(0, 3).forEach(n => {
                    console.log(`  Estilo: ${n.inDesignStyle} (${n.resolvedTag}.${n.resolvedClass || 'sin-clase'})`);
                    console.log(`    resolvedPresentation:`, JSON.stringify(n.resolvedPresentation));
                });
            } else {
                console.log("  [INFO] Todos los nodos analizados tienen resolvedPresentation vacío ({}).");
            }
            console.log("--------------------------------------------------------------------\n");
        }
        
        // ==========================================
        // 4. G3.4 / E13.4: INTERCEPCIÓN, PURGA E INYECCIÓN DEL CSS
        // ==========================================
        if (payload.css && fs.existsSync(payload.css)) {
            console.log(`[IPC] EJECUTANDO PURIFICACIÓN E INYECCIÓN DE CSS (G3.4 / E13.4)...`);
            const cssCrudo = fs.readFileSync(payload.css, 'utf-8');
            
            // E13.4: Pasamos el puente al purificador para rehidratar el CSS
            const cssLimpio = purgarCSSInDesign(cssCrudo, styleBridge);
            
            // Sobrescribimos el archivo CSS original de InDesign
            fs.writeFileSync(payload.css, cssLimpio, 'utf-8');
            
            // Guardamos la copia limpia en la ruta absoluta H:\...\estilos
            const carpetaEstilosProyecto = path.join(PROYECTO_ROOT, 'estilos');
            if (!fs.existsSync(carpetaEstilosProyecto)) fs.mkdirSync(carpetaEstilosProyecto, { recursive: true });
            fs.writeFileSync(path.join(carpetaEstilosProyecto, 'fragmento.css'), cssLimpio, 'utf-8');
            console.log(`[IPC] CSS PURIFICADO E INYECTADO CON ÉXITO: Guardado en H:...\\estilos`);
        }

        // ==========================================
        // SONDA E12.3: Antes de entregar a Lexmotor
        // ==========================================
        if (process.env.LEXMOTOR_E12_TRACE === '1') {
            const buscarNodo = (nodos, estilo) => {
                for (let n of nodos) {
                    if (n.inDesignStyle === estilo) return n;
                    if (Array.isArray(n.contenido)) {
                        let f = buscarNodo(n.contenido, estilo);
                        if (f) return f;
                    }
                }
                return null;
            };
            const titleIntoCore = buscarNodo(jsonNormalizado.contenido || [jsonNormalizado], 'P02_TITLE_MAIN');
            console.log('[E12:WATCHER:INTO-CORE]', {
                titulo: titleIntoCore ? `${titleIntoCore.resolvedTag}.${titleIntoCore.resolvedClass}` : 'NO_ENCONTRADO'
            });
        }

        // 5. Fases 1 a 4: Compilar Lexmotor
        const rutaCSSRelativa = '../estilos/fragmento.css'; // Mantenemos la ruta relativa limpia
        const resultado = await compilarLexmotor(
            jsonNormalizado,
            'InDesign_Export',
            rutaCSSRelativa
        );

        console.log(`[IPC] COMPILATION_COMPLETE id=${requestId}`);

        // ==========================================
        // ESCRIBIR EL ARCHIVO XHTML FÍSICO (salidaXHTML)
        // ==========================================
        const carpetaSalida = path.join(PROYECTO_ROOT, 'salidaXHTML');
        if (!fs.existsSync(carpetaSalida)) {
            fs.mkdirSync(carpetaSalida, { recursive: true });
        }
        
        const rutaFinalXHTML = path.join(carpetaSalida, `export_${requestId}.xhtml`);
        
        let contenidoAEscribir = "";
        if (typeof resultado === 'string') {
            contenidoAEscribir = resultado;
        } else if (typeof resultado === 'object' && resultado !== null) {
            contenidoAEscribir = resultado.xhtml || resultado.html || resultado.content || JSON.stringify(resultado, null, 2);
        }

        fs.writeFileSync(rutaFinalXHTML, contenidoAEscribir, 'utf-8');
        console.log(`[IPC] ARTEFACTO XHTML GENERADO EN: H:...\\salidaXHTML`);

        // 6. Escribir la respuesta
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
        console.error(`[IPC] COMPILATION_ERROR id=${requestId}`);
        console.error(error);

        const responsePath = path.join(responsesDir, `response-${requestId}.json`);
        fs.writeFileSync(responsePath, JSON.stringify({ success: false, requestId, error: error.message }, null, 2), 'utf-8');
        try { fs.unlinkSync(filePath); } catch(e){} 
    }
});