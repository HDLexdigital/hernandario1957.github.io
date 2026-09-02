'use strict';

const fs = require('fs');
const path = require('path');

describe('E12.6-C.48.3 — Auditoría de Aislamiento del Core (Invariante P.4)', () => {

    test('La fachada pipelineModular.js no debe importar módulos de infraestructura (fs, path)', () => {
        const rutaFachada = path.resolve(__dirname, '../../src/pipelineModular.js');
        const contenidoFachada = fs.readFileSync(rutaFachada, 'utf8');

        // Búsqueda estricta de imports de filesystem
        const usoFS = /\brequire\s*\(\s*['"]fs['"]\s*\)/.test(contenidoFachada);
        const usoPath = /\brequire\s*\(\s*['"]path['"]\s*\)/.test(contenidoFachada);

        expect(usoFS).toBe(false);
        expect(usoPath).toBe(false);
    });

});