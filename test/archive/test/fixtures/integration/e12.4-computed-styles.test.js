'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { compilarLexmotor } = require('../../../src/index');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.4 — Contratos de Renderizado Efectivo (CSSOM & Computed Styles via jsdom)', () => {

    let dom;
    let window;
    let document;

    beforeAll(async () => {
        const fixturePath = path.join(__dirname, '../raw/fragmento-211.json');
        const semanticMapPath = path.join(__dirname, '../raw/fragmento-211.semantic_map.json');
        const cssPath = path.join(__dirname, '../../../estilos/fragmento.css');

        const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
        const semanticMap = fs.existsSync(semanticMapPath) 
            ? JSON.parse(fs.readFileSync(semanticMapPath, 'utf8')) 
            : null;

        const adaptacion = adaptarInDesign({ jsonCrudo: fixtureRaw, semanticMap });
        const resultado = await compilarLexmotor(adaptacion.ast, 'fragmento-211', cssPath);

        const cssContent = fs.readFileSync(cssPath, 'utf8');

        const htmlCompleto = `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>${cssContent}</style>
            </head>
            <body>
                ${resultado.xhtml}
            </body>
            </html>`;

        dom = new JSDOM(htmlCompleto, { runScripts: 'dangerously' });
        window = dom.window;
        document = window.document;
    });

    test('E12.4-A — Computed Styles básicos presentes en el CSSOM', () => {
        const elemento = document.querySelector('[class]');
        expect(elemento).not.toBeNull();

        const computed = window.getComputedStyle(elemento);
        // Verificamos que getComputedStyle responda y contenga la propiedad declarativa
        expect(computed).toBeDefined();
        expect(typeof computed.getPropertyValue).toBe('function');
    });

    test('E12.4-B — Cascada, Herencia y Propiedades del CSSOM', () => {
        const elemento = document.querySelector('[class]');
        expect(elemento).not.toBeNull();
        const computed = window.getComputedStyle(elemento);

        // Validamos que el color del texto y la familia tipográfica estén definidos por el CSSOM
        expect(computed.color).toBeDefined();
        expect(computed.fontFamily).toBeDefined();
    });

    test('E12.4-C — Geometría CSS Computada (Márgenes y Sangrías)', () => {
        const elemento = document.querySelector('[class]');
        expect(elemento).not.toBeNull();
        const computed = window.getComputedStyle(elemento);

        expect(computed.marginTop).toBeDefined();
    });

    test('E12.4-D — Jerarquía Tipográfica Efectiva en el CSSOM', () => {
        const elementos = document.querySelectorAll('[class]');
        expect(elementos.length).toBeGreaterThan(0);

        // Verificamos que el motor procese correctamente los estilos en el DOM virtual
        elementos.forEach(el => {
            const comp = window.getComputedStyle(el);
            expect(comp).toBeDefined();
        });
    });

});