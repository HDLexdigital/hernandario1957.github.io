'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { constructorXHTML } = require('../../src/constructores/constructorXHTML');

// [C.43] Importamos el ensamblador desde su propia capa, respetando C.42
const { ensamblarDocumentoXHTML } = require('../../src/constructores/ensambladorDocumento');

describe('E12.6-C.43 — Contrato de Estructura de Raíz Única (Well-Formed XML)', () => {

    test('El XHTML generado debe ser validable como XML estricto sin múltiples raíces', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ejecutar pipeline (generación de fragmentos)
        const adaptado = adaptarInDesign({ jsonCrudo });
        const compilado = compilarLexmotor(adaptado.ast);
        const xhtmlFragmento = constructorXHTML(compilado.ast.contenido);
        
        // 2. [C.43] Frontera de Ensamblaje: convertir fragmento en documento XML
        const xhtmlDocumento = ensamblarDocumentoXHTML(xhtmlFragmento);

        // 3. Parseo XML Estricto
        let errorXML = null;
        let domXml = null;

        try {
            domXml = new JSDOM(xhtmlDocumento, { contentType: 'application/xhtml+xml' });
        } catch (error) {
            errorXML = error.message;
        }

        if (errorXML) {
            console.log('\n====================================================================');
            console.log('   E12.6-C.43 — FALLO DE VALIDACIÓN ESTRUCTURAL');
            console.log(`   Motivo: ${errorXML}`);
            console.log('====================================================================\n');
        }

        // 4. Asertos (C.43)
        expect(errorXML).toBeNull();
        expect(domXml).toBeDefined();
        
        const elementosP = domXml.window.document.querySelectorAll('p');
        console.log(`\n   [C.43] Total de <p> parseados en XML Estricto: ${elementosP.length}\n`);
    });

});