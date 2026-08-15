'use strict';

const fs = require('fs');
const path = require('path');
const { ejecutarPipelineModular } = require('../../src/pipelineModular');

describe('E12.6-C.47 — Contrato de Aislamiento y No-Dependencia del Consumidor Externo', () => {

    test('El consumidor externo interactúa exclusivamente con ejecutarPipelineModular y el artefacto C.46 sin importar módulos internos', () => {
        // 1. Verificamos que el consumidor no tiene necesidad de importar adaptadores ni renderers
        // La única importación permitida y utilizada es la fachada pública.
        expect(typeof ejecutarPipelineModular).toBe('function');

        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');
        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        const opciones = {
            title: 'Ley de Aislamiento UXP',
            cssName: 'estilos.css',
            lang: 'es-CO',
            nombreBase: 'ley_aislamiento'
        };

        // 2. Invocación exclusiva de la frontera pública
        const artefacto = ejecutarPipelineModular(jsonCrudo, opciones);

        // 3. El consumidor consume las tres propiedades canónicas de forma independiente y desacoplada
        const consumidorXhtml = artefacto.xhtml;
        const consumidorJson = artefacto.jsonOficial;
        const consumidorMetadatos = artefacto.metadatos;

        // Aserciones de aislamiento estructural
        expect(typeof consumidorXhtml).toBe('string');
        expect(consumidorXhtml.length).toBeGreaterThan(0);

        expect(typeof consumidorJson).toBe('object');
        expect(consumidorJson).not.toBeNull();
        expect(Array.isArray(consumidorJson.tokens)).toBe(true);

        expect(typeof consumidorMetadatos).toBe('object');
        expect(consumidorMetadatos.nombre).toBe(opciones.nombreBase);

        // 4. Garantía de que los submódulos internos están completamente ocultos al consumidor
        // Ninguna de las fases internas debe exponerse en el artefacto público
        expect(artefacto.adaptador).toBeUndefined();
        expect(artefacto.compilador).toBeUndefined();
        expect(artefacto.constructorXHTML).toBeUndefined();
        expect(artefacto.ensamblador).toBeUndefined();
    });

});