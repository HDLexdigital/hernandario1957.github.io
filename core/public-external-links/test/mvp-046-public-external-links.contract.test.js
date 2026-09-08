'use strict';

const fs = require('fs');
const path = require('path');

describe('MVP-046 Public External Links Contract', () => {
    const contractPath = path.join(process.cwd(), 'core', 'public-external-links', 'mvp-046-public-external-links.contract.json');
    let contract;

    beforeAll(() => {
        contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    });

    test('Existe el contrato MVP-046', () => {
        expect(fs.existsSync(contractPath)).toBe(true);
    });

    test('El contrato tiene id MVP-046', () => {
        expect(contract.id).toBe('MVP-046');
    });

    test('El contrato está en versión 0.1.0-draft', () => {
        expect(contract.version).toBe('0.1.0-draft');
    });

    test('El contrato declara el módulo core/public-external-links', () => {
        expect(contract.module).toBe('core/public-external-links');
    });

    test('El contrato incluye criterios de aceptación', () => {
        expect(Array.isArray(contract.acceptance_criteria)).toBe(true);
        expect(contract.acceptance_criteria.length).toBeGreaterThan(0);
    });

    test('El contrato incluye salidas esperadas', () => {
        expect(Array.isArray(contract.outputs)).toBe(true);
        expect(contract.outputs).toContain('public/external-links.html');
    });
});
