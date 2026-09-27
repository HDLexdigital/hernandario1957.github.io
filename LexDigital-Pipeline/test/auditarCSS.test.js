/**
 * @fileoverview test/auditarCSS.test.js
 * Pruebas unitarias para el auditor CSS del pipeline.
 */
const { auditarCSS } = require('../core/auditarCSS');

describe('Auditoría CSS', () => {
    test('Valida reglas CSS presentes en el XHTML', () => {
        const css = '.p01_body_base { font-size: 14pt; color: #1a1a1a; font-family: "Liberation Serif"; }';
        const xhtml = '<p class="p01_body_base">Texto de prueba</p>';

        const resultado = auditarCSS(css, xhtml);

        expect(resultado.totalReglas).toBe(1);
        expect(resultado.reglasValidas).toBe(1);
        expect(resultado.reglasInvalidas).toBe(0);
        expect(resultado.propiedades.fontSize).toBe(1);
        expect(resultado.propiedades.color).toBe(1);
        expect(resultado.propiedades.fontFamily).toBe(1);
        expect(resultado.errores.length).toBe(0);
    });

    test('Detecta valores undefined o NaN en CSS generado', () => {
        const cssInvalido = '.error_rule { font-size: undefined; width: NaNpx; }';
        const xhtml = '<p class="error_rule">Error</p>';

        const resultado = auditarCSS(cssInvalido, xhtml);

        expect(resultado.errores.length).toBeGreaterThan(0);
        expect(resultado.errores.some(e => e.includes('undefined'))).toBe(true);
        expect(resultado.errores.some(e => e.includes('NaN'))).toBe(true);
    });

    test('Advierte sobre clases definidas pero no usadas en XHTML', () => {
        const css = '.clase_huerfana { margin: 10px; }';
        const xhtml = '<p class="otra_clase">Contenido</p>';

        const resultado = auditarCSS(css, xhtml);

        expect(resultado.reglasValidas).toBe(0);
        expect(resultado.advertencias.some(a => a.includes('clase_huerfana'))).toBe(true);
    });
});
