'use strict';

const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../src/index');
const { adaptarInDesign } = require('../src/adaptadores/InDesignAdapter');

async function auditarEstilosV2() {
    console.log('============================================================');
    console.log('   E12.2 [PASO 1 & 2] — AUDITORÍA Y MATRIZ SEMÁNTICA XHTML/CSS');
    console.log('============================================================');

    const fixturePath = path.join(__dirname, '../test/fixtures/raw/fragmento-211.json');
    const semanticMapPath = path.join(__dirname, '../test/fixtures/raw/fragmento-211.semantic_map.json');
    const cssPath = path.join(__dirname, '../test/fixtures/raw/fragmento-211.css'); // O la ruta correcta del fixture CSS

    // E12.2-A: Verificación previa del fixture CSS en disco
    console.log(`[E12.2-A] Verificando existencia de fixture CSS en: ${cssPath}`);
    const cssExiste = fs.existsSync(cssPath);
    console.log(`[E12.2-A] Archivo CSS existe en disco: ${cssExiste}`);
    
    let cssContenidoFixture = '';
    if (cssExiste) {
        cssContenidoFixture = fs.readFileSync(cssPath, 'utf8');
        console.log(`[E12.2-A] Tamaño del CSS en disco: ${cssContenidoFixture.length} caracteres`);
    }

    const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const semanticMap = fs.existsSync(semanticMapPath) 
        ? JSON.parse(fs.readFileSync(semanticMapPath, 'utf8')) 
        : null;

    const adaptacion = adaptarInDesign({ jsonCrudo: fixtureRaw, semanticMap });
    
    // Inyectamos la ruta absoluta o el contenido correcto según requiera el motor
    const resultado = await compilarLexmotor(
        adaptacion.ast,
        'fragmento-211',
        cssExiste ? cssPath : 'fragmento-211.css'
    );

    console.log(`[E12.2-A] CSS devuelto por resultado.css: ${typeof resultado.css === 'string' ? resultado.css.length : 0} caracteres\n`);

    // Extracción robusta de clases XHTML (buscando atributos class="...")
    const matchClasses = resultado.xhtml.match(/class="([^"]+)"/g) || [];
    const frecuenciasClases = {};
    const clasesXHTMLSet = new Set();

    matchClasses.forEach(m => {
        const classNameMatch = m.match(/class="([^"]+)"/);
        if (classNameMatch && classNameMatch[1]) {
            classNameMatch[1].split(/\s+/).forEach(c => {
                clasesXHTMLSet.add(c);
                frecuenciasClases[c] = (frecuenciasClases[c] || 0) + 1;
            });
        }
    });

    // Extracción de selectores CSS definidos (ej. .texto_cuerpo, p.articulo, etc.)
    const cssText = resultado.css || cssContenidoFixture;
    const matchCssSelectors = cssText.match(/\.([a-zA-Z0-9_-]+)\b/g) || [];
    const clasesCSSSet = new Set(matchCssSelectors.map(s => s.substring(1)));

    console.log('------------------------------------------------------------');
    console.log(' MATRIZ DE CORRESPONDENCIA SEMÁNTICA XHTML ↔ CSS (Paso 3)');
    console.log('------------------------------------------------------------');
    
    const matriz = Object.keys(frecuenciasClases).map(clase => {
        const enCSS = clasesCSSSet.has(clase);
        return {
            'Categoría Semántica': clase,
            'Frecuencia (Fixture)': frecuenciasClases[clase],
            'Definida en CSS': enCSS ? 'SÍ ✅' : 'NO ❌'
        };
    });
    console.table(matriz);

    // E12.2-F: Verificación de Desacoplamiento de InDesign
    console.log('\n--- VERIFICACIÓN DE DESACOPLAMIENTO (E12.2-F) ---');
    const estilosInDesignCrudos = ['P01_BODY_BASE', 'P01_BODY_CONT', 'P02_TITLE_MAIN', 'P02_TITLE_PART', 'P03_CENTER_BOLD'];
    let contaminacionDetectada = false;

    estilosInDesignCrudos.forEach(estiloInDesign => {
        const presenteEnXHTML = clasesXHTMLSet.has(estiloInDesign);
        if (presenteEnXHTML) {
            console.warn(`[ALERTA CONTAMINACIÓN] El estilo crudo de InDesign "${estiloInDesign}" se filtró como clase XHTML.`);
            contaminacionDetectada = true;
        }
    });

    if (!contaminacionDetectada) {
        console.log('[OK] Ningún estilo crudo de InDesign contamina el XHTML. Abstracción semántica confirmada.');
    }

    console.log('\n============================================================');
    console.log('   AUDITORÍA V2 CONCLUIDA. MATRIZ LISTA PARA CONGELAR CONTRATO');
    console.log('============================================================');
}

auditarEstilosV2().catch(err => {
    console.error('[FATAL] Error en la auditoría V2:', err);
});