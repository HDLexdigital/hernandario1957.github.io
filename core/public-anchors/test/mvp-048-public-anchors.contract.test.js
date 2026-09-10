'use strict';

const fs = require('fs');
const path = require('path');

describe('MVP-048 Public Anchors Contract', () => {
    const contractPath = path.join(process.cwd(), 'core', 'public-anchors', 'mvp-048-public-anchors.contract.json');
    let contract;

    beforeAll(() => {
        contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    });

    test('Existe el contrato MVP-048', () => {
        expect(fs.existsSync(contractPath)).toBe(true);
    });

    test('El contrato tiene id MVP-048', () => {
        expect(contract.id).toBe('MVP-048');
    });

    test('El contrato está en versión 0.1.0-draft', () => {
        expect(contract.version).toMatch(/^(0\.1\.0-draft|1\.0\.0)$/);
    });

    test('El contrato declara el módulo core/public-anchors', () => {
        expect(contract.module).toBe('core/public-anchors');
    });

    test('El contrato incluye criterios de aceptación', () => {
        expect(Array.isArray(contract.acceptance_criteria)).toBe(true);
        expect(contract.acceptance_criteria.length).toBeGreaterThan(0);
    });

    test('El contrato incluye salidas esperadas', () => {
        expect(Array.isArray(contract.outputs)).toBe(true);
        expect(contract.outputs).toContain('public/anchors.html');
    });
});
