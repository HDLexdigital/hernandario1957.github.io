'use strict';

const fs = require('fs');
const path = require('path');

describe('MVP-047 Anchors Contract', () => {
    const contractPath = path.join(process.cwd(), 'core', 'anchors', 'mvp-047-anchors.contract.json');
    let contract;

    beforeAll(() => {
        contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    });

    test('Existe el contrato MVP-047', () => {
        expect(fs.existsSync(contractPath)).toBe(true);
    });

    test('El contrato tiene id MVP-047', () => {
        expect(contract.id).toBe('MVP-047');
    });

    test('El contrato está en versión 0.1.0-draft', () => {
        expect(contract.version).toMatch(/^(0\.1\.0-draft|1\.0\.0)$/);
    });

    test('El contrato declara el módulo core/anchors', () => {
        expect(contract.module).toBe('core/anchors');
    });

    test('El contrato incluye criterios de aceptación', () => {
        expect(Array.isArray(contract.acceptance_criteria)).toBe(true);
        expect(contract.acceptance_criteria.length).toBeGreaterThan(0);
    });

    test('El contrato incluye salidas esperadas', () => {
        expect(Array.isArray(contract.outputs)).toBe(true);
        expect(contract.outputs).toContain('public/anchors-report.json');
    });
});
