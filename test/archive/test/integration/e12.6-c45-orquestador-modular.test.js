'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// C.45: Exigimos la existencia de una nueva fachada pÃºblica para el motor modular
const { ejecutarPipelineModular } = require('../../src/pipelineModular');

describe('E12.6-C.45 â€” Contrato de OrquestaciÃ³n Modular (Fachada PÃºblica)', () => {

    test('La fachada debe encadenar Adaptador, Compilador, Constructor y Ensamblador de forma transparente', () => {
        // 1. Preparar Entradas (Frontera PÃºblica)
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');
        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        const opciones = {
            title: 'Ley Modular de Prueba',
            cssName: 'estilos-modulares.css',
            lang: 'es-CO'
        };

        // 2. Ejecutar el orquestador (Esto fallarÃ¡ porque src/pipelineModular.js no existe)
        const artefacto = ejecutarPipelineModular(jsonCrudo, opciones);
		const xhtmlFinal = artefacto.xhtml;

        // 3. VerificaciÃ³n Estructural (C.43 + C.44 heredados)
        expect(typeof artefacto).toBe('object');
		expect(typeof xhtmlFinal).toBe('string');
        
        const dom = new JSDOM(xhtmlFinal, { contentType: 'application/xhtml+xml' });
        const doc = dom.window.document;

        // A. Verifica RaÃ­z y Metadatos (Evidencia C.43/C.44)
        expect(doc.documentElement.tagName.toLowerCase()).toBe('html');
        expect(doc.querySelector('title').textContent).toBe(opciones.title);
        expect(doc.querySelector('link[rel="stylesheet"]').getAttribute('href')).toBe(opciones.cssName);

        // B. Verifica PreservaciÃ³n del Motor Core (Evidencia C.42)
        const parrafos = doc.querySelectorAll('p');
        expect(parrafos.length).toBe(208); // Si no da 208, el orquestador rompiÃ³ el pipeline
    });

});
