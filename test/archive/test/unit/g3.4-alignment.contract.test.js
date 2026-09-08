/**
 * G3.4-T2 — EPUB Class Coverage Contract Test
 * Verifica que toda clase definida en semantic_map.exportTagging.epub.className
 * posea un selector CSS contractual correspondiente (C_map ⊆ C_css).
 */

const assert = require('assert');

/**
 * Extrae el conjunto de clases de exportación EPUB desde el semantic map.
 */
function extraerClasesSemanticMap(semanticMap) {
    const classes = new Set();
    const styles = semanticMap.styles || [];
    
    for (const style of styles) {
        if (style.exportTagging && style.exportTagging.epub && style.exportTagging.epub.className) {
            classes.add(style.exportTagging.epub.className);
        }
    }
    return classes;
}

/**
 * Extrae los selectores de clase definidos en el contenido CSS.
 */
function extraerSelectoresCSS(cssContent) {
    const classes = new Set();
    // Expresión regular para capturar selectores de clase CSS (ej: .p01-body-cont { ... })
    const regex = /\.([a-zA-Z0-9_-]+)\s*\{/g;
    let match;
    
    while ((match = regex.exec(cssContent)) !== null) {
        classes.add(match[1]);
    }
    return classes;
}

/**
 * Valida el contrato de cobertura: C_map ⊆ C_css
 */
function validarCoberturaCSS(semanticMap, cssContent) {
    const mapClasses = extraerClasesSemanticMap(semanticMap);
    const cssClasses = extraerSelectoresCSS(cssContent);
    
    const missingClasses = [];
    for (const cls of mapClasses) {
        if (!cssClasses.has(cls)) {
            missingClasses.push(cls);
        }
    }
    
    return {
        valid: missingClasses.length === 0,
        missingClasses,
        mapClassesSize: mapClasses.size,
        cssClassesSize: cssClasses.size
    };
}

// ==========================================
// SUITE DE PRUEBAS DE CONTRATO G3.4-T2
// ==========================================
describe('G3.4-T2 — EPUB Class Coverage Contract', () => {

    const semanticMapFixture = {
        styles: [
            {
                originalName: 'P01_BODY_BASE',
                exportTagging: { epub: { className: 'p01-body-cont' } }
            },
            {
                originalName: 'P02_TITLE_PART',
                exportTagging: { epub: { className: 'p02-title-main' } }
            }
        ]
    };

    test('CASO 1 (GREEN): Cobertura completa de clases del semantic map', () => {
        const cssContractual = `
            .p01-body-cont { display: block; }
            .p02-title-main { font-weight: bold; }
        `;

        const resultado = validarCoberturaCSS(semanticMapFixture, cssContractual);
        assert.strictEqual(resultado.valid, true);
        assert.strictEqual(resultado.missingClasses.length, 0);
    });

    test('CASO 2 (RED): Detección de clase ausente en el CSS contractual', () => {
        const cssIncompleto = `
            .p01-body-base { display: block; } /* Falta p01-body-cont y p02-title-main */
        `;

        const resultado = validarCoberturaCSS(semanticMapFixture, cssIncompleto);
        assert.strictEqual(resultado.valid, false);
        assert.ok(resultado.missingClasses.includes('p01-body-cont'));
        assert.ok(resultado.missingClasses.includes('p02-title-main'));
    });

    test('CASO 3 (GREEN): Tolerancia a clases CSS adicionales o auxiliares (Ruido permitido)', () => {
        const cssConRuido = `
            .p01-body-cont { display: block; }
            .p02-title-main { font-weight: bold; }
            .clase-auxiliar-global { color: red; }
            .otra-clase-extra { margin: 0; }
        `;

        const resultado = validarCoberturaCSS(semanticMapFixture, cssConRuido);
        assert.strictEqual(resultado.valid, true);
        assert.strictEqual(resultado.missingClasses.length, 0);
        assert.ok(resultado.cssClassesSize > resultado.mapClassesSize);
    });

});