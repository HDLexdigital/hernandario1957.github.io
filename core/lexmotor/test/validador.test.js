/**
 * test/validador.test.js
 * Pruebas unitarias para el validador automático de XHTML
 */
const { validarArchivoXHTML } = require('../../../src/validador/validadorXHTML.js');
const fs = require('fs');
const path = require('path');

describe('Validador Automático de XHTML', () => {
    const tempFile = path.join(__dirname, '../../../test/fixtures/temp-valida.xhtml');

    afterEach(() => {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    });

    test('Valida con éxito un XHTML que cumple con el perfil WEB', () => {
        fs.writeFileSync(tempFile, '<h1 lang="es-CO">Título de Prueba</h1>');
        const resultado = validarArchivoXHTML(tempFile, 'WEB');
        expect(resultado.isValid).toBe(true);
        expect(resultado.violations.length).toBe(0);
    });

    test('Falla automáticamente si un XHTML WEB contiene epub:type prohibido', () => {
        fs.writeFileSync(tempFile, '<h1 epub:type="title" lang="es-CO">Título Roto</h1>');
        const resultado = validarArchivoXHTML(tempFile, 'WEB');
        expect(resultado.isValid).toBe(false);
        expect(resultado.violations[0]).toContain('ERR-VAL-002');
    });
});
