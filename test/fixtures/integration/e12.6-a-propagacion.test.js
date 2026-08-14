'use strict';

const path = require('path');
const { renderParagraph } = require(path.resolve(__dirname, '../../../src/constructores/constructorXHTML.js'));
const { PresentationResolutionError } = require(path.resolve(__dirname, '../../../src/errors/PresentationResolutionError'));

describe('E12.6-A — Contrato de propagación de clases dobles y aislamiento semántico', () => {

    test('A1 & A2 & A3 & A4 & A5: Combina clase semántica y clase de presentación en resolvedClass y XHTML', () => {
        const nodo = {
            tipoNodo: 'paragraph',
            claseLegal: 'texto_cuerpo',
            estiloParrafo: 'P01_BODY_BASE',
            texto: 'Texto de prueba jurídica'
        };

        const resultadoHTML = renderParagraph(nodo);

        expect(resultadoHTML).toContain('class="texto_cuerpo cuerpo-siguiente"');
    });

    test('A4: Resuelve P07_INDENT_L1 como sangria-n1 preservando la semántica', () => {
        const nodo = {
            tipoNodo: 'paragraph',
            claseLegal: 'texto_cuerpo',
            estiloParrafo: 'P07_INDENT_L1',
            texto: 'Texto con sangría'
        };

        const resultadoHTML = renderParagraph(nodo);

        expect(resultadoHTML).toContain('class="texto_cuerpo sangria-n1"');
    });

    test('A6: Falla con PresentationResolutionError si el estilo de origen no está mapeado', () => {
        const nodo = {
            tipoNodo: 'paragraph',
            claseLegal: 'texto_cuerpo',
            estiloParrafo: 'P99_ESTILO_DESCONOCIDO',
            texto: 'Texto erróneo'
        };

        expect(() => renderParagraph(nodo)).toThrow(PresentationResolutionError);
    });

    test('A7: Falla con PresentationResolutionError si falta por completo el metadato de origen', () => {
        const nodo = {
            tipoNodo: 'paragraph',
            claseLegal: 'texto_cuerpo',
            texto: 'Texto huérfano de origen'
        };

        expect(() => renderParagraph(nodo)).toThrow(PresentationResolutionError);
    });

    test('A8: constructorXHTML.js no contiene la matriz estática de InDesign (aislamiento de responsabilidades)', () => {
        const fs = require('fs');
        const codigoRenderer = fs.readFileSync(path.resolve(__dirname, '../../../src/constructores/constructorXHTML.js'), 'utf8');
        
        expect(codigoRenderer).not.toContain('P01_BODY_BASE');
        expect(codigoRenderer).not.toContain('P07_INDENT_L1');
    });

});