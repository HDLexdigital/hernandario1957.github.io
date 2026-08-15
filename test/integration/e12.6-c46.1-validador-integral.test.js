'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { ejecutarPipelineModular } = require('../../src/pipelineModular');

describe('E12.6-C.46.1 — Validación Contractual Integral del Pipeline Modular', () => {

    test('El artefacto de salida preserva la cadena causal completa y la cardinalidad de producción', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');
        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        const opciones = {
            title: 'Constitución Política de Colombia - Validación Integral',
            cssName: 'lexdigital_estilos.css',
            lang: 'es-CO',
            nombreBase: 'ConstitucionPolitica'
        };

        const artefacto = ejecutarPipelineModular(jsonCrudo, opciones);

        expect(artefacto.xhtml).toBeDefined();
        const dom = new JSDOM(artefacto.xhtml, { contentType: 'application/xhtml+xml' });
        const doc = dom.window.document;

        expect(doc.documentElement.tagName.toLowerCase()).toBe('html');
        expect(doc.querySelector('title').textContent).toBe(opciones.title);
        expect(doc.querySelector('link[rel="stylesheet"]').getAttribute('href')).toBe(opciones.cssName);

        const parrafos = doc.querySelectorAll('p');
        expect(parrafos.length).toBe(208);

        expect(artefacto.jsonOficial).toBeDefined();
        // El fixture fragmento-211.json produce un documento o título acorde al artefacto crudo
        expect(artefacto.jsonOficial.documento).toBeDefined();
        expect(Array.isArray(artefacto.jsonOficial.tokens)).toBe(true);
        expect(artefacto.jsonOficial.tokens.length).toBe(208);

        expect(artefacto.metadatos).toBeDefined();
        expect(artefacto.metadatos.nombre).toBe(opciones.nombreBase);
        expect(artefacto.metadatos.version).toBe('1.0.0');
        expect(typeof artefacto.metadatos.tiempoTotal).toBe('number');
        expect(artefacto.metadatos.tiempoTotal).toBeGreaterThan(0);
    });

});