'use strict';

const fs = require('fs');
const path = require('path');

describe('E12.6-C.50.6 — Auditoría de Aislamiento del Transporte UXP/IPC', () => {

    test('pipelineModular.js no debe importar infraestructura de transporte', () => {
        const rutaPipeline = path.resolve(
            __dirname,
            '../../src/pipelineModular.js'
        );

        const codigo = fs.readFileSync(rutaPipeline, 'utf8');

        const importsInfraestructura = [
            /\brequire\s*\(\s*['"]net['"]\s*\)/,
            /\brequire\s*\(\s*['"]http['"]\s*\)/,
            /\brequire\s*\(\s*['"]https['"]\s*\)/,
            /\brequire\s*\(\s*['"]ws['"]\s*\)/,
            /\bfrom\s+['"]net['"]/,
            /\bfrom\s+['"]http['"]/,
            /\bfrom\s+['"]https['"]/,
            /\bfrom\s+['"]ws['"]/,
            /\bfrom\s+['"]uxp['"]/,
            /\brequire\s*\(\s*['"]uxp['"]\s*\)/
        ];

        const violaciones = importsInfraestructura
            .filter((patron) => patron.test(codigo));

        expect(violaciones).toEqual([]);
    });

    test('pipelineModular.js no debe contener referencias directas al transporte UXP/IPC', () => {
        const rutaPipeline = path.resolve(
            __dirname,
            '../../src/pipelineModular.js'
        );

        const codigo = fs.readFileSync(rutaPipeline, 'utf8');

        expect(codigo).not.toMatch(/\bWebSocket\b/);
        expect(codigo).not.toMatch(/\bIPC\b/);
        expect(codigo).not.toMatch(/\bUXP\b/);
    });

});