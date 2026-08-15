'use strict';

const fs = require('fs');
const path = require('path');
// Importamos la futura Raíz de Composición (Composition Root)
const { procesarDocumentoE2E } = require('../../src/index');

describe('E12.6-C.49 — Composition Root y Flujo End-to-End (E2E)', () => {
    const dirSalida = path.resolve(__dirname, '../../test/temp/c49_salida');
    const rutaEntrada = path.resolve(__dirname, '../../test/fixtures/raw/fragmento-211.json');

    beforeEach(() => {
        if (fs.existsSync(dirSalida)) {
            fs.rmSync(dirSalida, { recursive: true, force: true });
        }
        fs.mkdirSync(dirSalida, { recursive: true });
    });

    afterAll(() => {
        if (fs.existsSync(dirSalida)) {
            fs.rmSync(dirSalida, { recursive: true, force: true });
        }
    });

    test('C.49.0 - El Composition Root debe exponer la función procesarDocumentoE2E', () => {
        expect(typeof procesarDocumentoE2E).toBe('function');
    });

    test('C.49.1 / C.49.2 - Ejecución del flujo completo e instanciación de Persistencia', () => {
        const opciones = { nombreBase: 'prueba_e2e_c49', title: 'LexDigital E2E Test' };

        // 1. Invocamos únicamente la Raíz de Composición
        const resultado = procesarDocumentoE2E(rutaEntrada, dirSalida, opciones);

        // 2. Verificamos que la infraestructura se haya disparado correctamente
        expect(resultado).toBeDefined();
        expect(resultado.exito).toBe(true);
        expect(resultado.archivos).toBeDefined();
        
        expect(fs.existsSync(resultado.archivos.xhtml)).toBe(true);
        expect(fs.existsSync(resultado.archivos.jsonOficial)).toBe(true);
        expect(fs.existsSync(resultado.archivos.metadatos)).toBe(true);

        // 3. Verificamos que el Core haya procesado el documento real (fragmento-211)
        const metadatos = JSON.parse(fs.readFileSync(resultado.archivos.metadatos, 'utf8'));
        expect(metadatos.nombre).toBe('prueba_e2e_c49');
        
        const xhtml = fs.readFileSync(resultado.archivos.xhtml, 'utf8');
        
        // Verificamos la raíz del documento XML/HTML en lugar del Doctype estricto
        expect(xhtml.includes('<html')).toBe(true);
        
        // Comprobamos la presencia de contenido del fragmento 211 real
        expect(xhtml.includes('Constitución Política de Colombia')).toBe(true);
    });
});