'use strict';

const fs = require('fs');
const path = require('path');
const { ejecutarPipelineModular } = require('../../src/pipelineModular');

describe('E12.6-C.46 — Contrato del Artefacto de Salida Canónico', () => {

    test('La fachada debe devolver el contrato estructural: { jsonOficial, xhtml, metadatos }', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');
        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        const opciones = {
            title: 'Ley Modular de Prueba',
            cssName: 'estilos-modulares.css',
            lang: 'es-CO',
            nombreBase: 'ley_prueba' // Campo legacy esperado por el orquestador
        };

        const artefacto = ejecutarPipelineModular(jsonCrudo, opciones);

        // 1. Verificación de la raíz del artefacto
        expect(typeof artefacto).toBe('object');
        expect(artefacto).not.toBeNull();
        
        // 2. Verificación de la propiedad 'xhtml'
        expect(artefacto).toHaveProperty('xhtml');
        expect(typeof artefacto.xhtml).toBe('string');
        expect(artefacto.xhtml.includes('<!DOCTYPE html>') || artefacto.xhtml.includes('<?xml')).toBe(true);

        // 3. Verificación de la propiedad 'jsonOficial' (El AST preservado)
        expect(artefacto).toHaveProperty('jsonOficial');
        expect(artefacto.jsonOficial).toHaveProperty('documento');
        expect(artefacto.jsonOficial).toHaveProperty('tokens');
        // El AST compilado debe tener la cardinalidad correcta
        expect(artefacto.jsonOficial.tokens.length).toBeGreaterThan(0);

        // 4. Verificación de la propiedad 'metadatos' (Telemetría y contexto)
        expect(artefacto).toHaveProperty('metadatos');
        expect(artefacto.metadatos).toHaveProperty('version');
        expect(artefacto.metadatos).toHaveProperty('timestamp');
        expect(artefacto.metadatos).toHaveProperty('tiempoTotal');
        expect(artefacto.metadatos.nombre).toBe(opciones.nombreBase);
    });

});
