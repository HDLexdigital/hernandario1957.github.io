'use strict';

// Ajusta este require según la profundidad exacta de tu estructura de carpetas:
// Si estás en test/adapters/ InDesignAdapterTokens.test.js, la ruta correcta es '../../src/adaptadores/InDesignAdapter'
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');

describe('Capa Anticorrupción (E10) - Pasarela Dialecto Tokens', () => {
    const semanticMapMock = {
        styles: [
            { originalName: 'P02_TITLE_PART', type: 'paragraph' },
            { originalName: 'P01_BODY_BASE', type: 'paragraph' },
            { originalName: 'P01_BODY_CONT', type: 'paragraph' },
            { originalName: 'C01_BOLD', type: 'character' }
        ]
    };

    test('Debe rechazar explícitamente tipos transicionales como "referencia"', () => {
        const payload = {
            tokens: [{ tipo: 'referencia', estilo_indesign: 'P01_BODY_CONT', texto_completo: 'Ver art 5' }]
        };
        expect(() => adaptarInDesign({ jsonCrudo: payload, semanticMap: semanticMapMock })).toThrow(/Rechazo E10/);
    });

    test('Debe rechazar explícitamente "transicion"', () => {
        const payload = {
            tokens: [{ tipo: 'transicion', estilo_indesign: 'P01_BODY_CONT', texto_completo: 'Artículo transitorio 1' }]
        };
        expect(() => adaptarInDesign({ jsonCrudo: payload, semanticMap: semanticMapMock })).toThrow(/Rechazo E10/);
    });

    test('Debe corregir títulos usando resolverTipoBase', () => {
        const payload = {
            tokens: [{ tipo: 'titulo', estilo_indesign: 'P02_TITLE_PART', texto_completo: 'Constitución' }]
        };
        const resultado = adaptarInDesign({ jsonCrudo: payload, semanticMap: semanticMapMock });
        expect(resultado.ast.contenido[0].tipo).toBe('titulo_parte');
        expect(resultado.diagnostics.valid).toBe(true);
    });

    test('Debe rechazar "titulo" si su estilo no tiene resolución explícita', () => {
        const payload = {
            tokens: [{ tipo: 'titulo', estilo_indesign: 'ESTILO_INVALIDO_TITULO', texto_completo: 'Título huérfano' }]
        };
        expect(() => adaptarInDesign({ jsonCrudo: payload, semanticMap: semanticMapMock })).toThrow();
    });

    test('Debe preservar tipos nativos válidos sin degradación', () => {
        const payload = {
            tokens: [{ tipo: 'articulo', estilo_indesign: 'P01_BODY_BASE', texto_completo: 'Artículo 1.' }]
        };
        const resultado = adaptarInDesign({ jsonCrudo: payload, semanticMap: semanticMapMock });
        expect(resultado.ast.contenido[0].tipo).toBe('articulo');
        expect(resultado.diagnostics.valid).toBe(true);
    });

    test('Debe resolver un token sin tipo cuando el estilo tiene puente base', () => {
        const payload = {
            tokens: [{ estilo_indesign: 'P01_BODY_CONT', texto_completo: 'Párrafo de continuación' }]
        };
        const resultado = adaptarInDesign({ jsonCrudo: payload, semanticMap: semanticMapMock });
        expect(resultado.ast.contenido[0].tipo).toBe('parrafo');
        expect(resultado.diagnostics.valid).toBe(true);
    });

    test('Debe fallar de manera estricta si un tipo no puede resolverse', () => {
        const payload = {
            tokens: [{ tipo: 'desconocido', estilo_indesign: 'ESTILO_INEXISTENTE', texto_completo: 'Texto' }]
        };
        expect(() => adaptarInDesign({ jsonCrudo: payload, semanticMap: semanticMapMock })).toThrow();
    });

   test('Debe preservar y normalizar los fragmentos internos de cada token', () => {
        const payload = {
            tokens: [{
                tipo: 'articulo',
                estilo_indesign: 'P01_BODY_BASE',
                fragmentos: [{ texto: 'Texto con estilo', estiloCaracter: 'C01_BOLD' }]
            }]
        };
        const resultado = adaptarInDesign({ jsonCrudo: payload, semanticMap: semanticMapMock });
        
        // Se valida contra .contenido porque el adaptador normaliza fragmentos a contenido en el AST canónico
        expect(resultado.ast.contenido[0].contenido).toBeDefined();
        expect(resultado.ast.contenido[0].contenido[0].texto).toBe('Texto con estilo');
        expect(resultado.ast.contenido[0].contenido[0].estiloCaracter).toBe('C01_BOLD');
        expect(resultado.diagnostics.valid).toBe(true);
    });
	
    test('Debe garantizar la inmutabilidad profunda del objeto de entrada', () => {
        const payload = {
            tokens: [{ tipo: 'articulo', estilo_indesign: 'P01_BODY_BASE', texto_completo: 'Inmutable' }]
        };
        const copiaPayload = JSON.parse(JSON.stringify(payload));
        adaptarInDesign({ jsonCrudo: payload, semanticMap: semanticMapMock });
        expect(payload).toEqual(copiaPayload);
    });

    test('Debe garantizar que el AST resultante sea 100% serializable para IPC', () => {
        const payload = {
            tokens: [{
                tipo: 'articulo',
                estilo_indesign: 'P01_BODY_BASE',
                texto_completo: 'Artículo serializable.',
                fragmentos: [
                    { texto: 'Artículo', estiloCaracter: 'C01_BOLD' },
                    { texto: ' serializable.', estiloCaracter: null }
                ]
            }]
        };
        const resultado = adaptarInDesign({ jsonCrudo: payload, semanticMap: semanticMapMock });

        // 1. La serialización no debe arrojar excepciones (ej. por referencias circulares nativas)
        expect(() => JSON.stringify(resultado.ast)).not.toThrow();

        // 2. Ida y vuelta (Round-trip) perfecta: asegura que es un POJO puro
        const serializado = JSON.stringify(resultado.ast);
        const reconstruido = JSON.parse(serializado);

        expect(reconstruido).toEqual(resultado.ast);
    });
});