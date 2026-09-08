'use strict';

const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../../../src/index');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.1 — Contrato Estructural XHTML y Regresión Semántica', () => {

    const fixturePath = path.join(__dirname, '../raw/fragmento-211.json');
    const semanticMapPath = path.join(__dirname, '../raw/fragmento-211.semantic_map.json');

    let resultado;
    let nodosAST;
    let domParserDisponible = false;

    beforeAll(async () => {
        const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
        const semanticMap = fs.existsSync(semanticMapPath) 
            ? JSON.parse(fs.readFileSync(semanticMapPath, 'utf8')) 
            : null;

        const adaptacion = adaptarInDesign({ jsonCrudo: fixtureRaw, semanticMap });

        resultado = await compilarLexmotor(
            adaptacion.ast,
            'fragmento-211',
            'fragmento-211.css'
        );

        nodosAST = resultado.jsonOficial.tokens || resultado.jsonOficial.contenido || [];
    });

    test('A. Salida XHTML: Existencia y Tipo', () => {
        expect(resultado).toBeDefined();
        expect(resultado.xhtml).toBeDefined();
        expect(typeof resultado.xhtml).toBe('string');
        expect(resultado.xhtml.length).toBeGreaterThan(0);
    });

    test('B & C. Estructura documental y parseabilidad XML', () => {
        // Verificamos si DOMParser está disponible globalmente en este entorno de Node
        const hasGlobalDOMParser = typeof DOMParser !== 'undefined';
        
        console.log(`[E12.1-C] DOMParser global disponible en Node: ${hasGlobalDOMParser}`);

        if (hasGlobalDOMParser) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(resultado.xhtml, 'application/xhtml+xml');
            
            const parserError = doc.querySelector('parsererror');
            expect(parserError).toBeNull();

            expect(doc.documentElement).toBeDefined();
            expect(doc.documentElement.tagName.toLowerCase()).toBe('html');
            expect(doc.querySelector('head')).not.toBeNull();
            expect(doc.querySelector('body')).not.toBeNull();
        } else {
            // Fallback de validación estricta por cadenas si DOMParser requiere polyfill
            expect(resultado.xhtml).toMatch(/<html[\s>]/i);
            expect(resultado.xhtml).toMatch(/<head[\s>]/i);
            expect(resultado.xhtml).toMatch(/<body[\s>]/i);
        }
    });

    test('D. Integridad de Codificación y Caracteres Especiales (UTF-8)', () => {
        // Validación semántica de tildes y caracteres propios del español jurídico
        expect(resultado.xhtml).toContain('Constitución Política');
        expect(resultado.xhtml).toContain('PREÁMBULO');
        expect(resultado.xhtml).toContain('Nación');
    });

    test('E. Medición de correspondencia estructural AST (208) → DOM (N)', () => {
        console.log(`[E12.1-E] Total de nodos en AST canónico: ${nodosAST.length}`);

        if (typeof DOMParser !== 'undefined') {
            const parser = new DOMParser();
            const doc = parser.parseFromString(resultado.xhtml, 'application/xhtml+xml');
            
            const elementosBody = doc.body.querySelectorAll('*');
            const parrafos = doc.body.querySelectorAll('p');
            const headings = doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6');

            console.log(`[E12.1-E] Elementos totales en <body>: ${elementosBody.length}`);
            console.log(`[E12.1-E] Elementos <p> en <body>: ${parrafos.length}`);
            console.log(`[E12.1-E] Elementos de título/heading en <body>: ${headings.length}`);
        } else {
            // Conteo básico por expresiones regulares de etiquetas de apertura
            const tagsMatch = resultado.xhtml.match(/<([p|h][0-9]*)[^>]*>/g) || [];
            console.log(`[E12.1-E] Conteo heurístico de etiquetas de bloque: ${tagsMatch.length}`);
        }

        // De momento, mantenemos la medición sin un expect rígido 1-a-1
        expect(nodosAST.length).toBe(208);
    });

    test('F. Preserva contenido jurídico fundamental', () => {
        expect(resultado.xhtml).toContain('Constitución Política');
        expect(resultado.xhtml).toContain('PREÁMBULO');
        expect(resultado.xhtml).toContain('Artículo 1.');
        expect(resultado.xhtml).toContain('Artículo 2.');
    });

    test('G. Ausencia absoluta de artefactos transicionales [VACÍO]', () => {
        expect(resultado.xhtml).not.toContain('[VACÍO]');
    });

});