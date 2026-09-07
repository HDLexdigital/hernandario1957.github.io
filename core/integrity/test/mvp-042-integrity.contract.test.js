'use strict';

const fs = require('fs');
const path = require('path');

describe('MVP-042 Integrity Contract', () => {
    const contractPath = path.join(process.cwd(), 'core', 'integrity', 'mvp-042-integrity.contract.json');
    let contract;

    beforeAll(() => {
        contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    });

    test('Existe el contrato MVP-042', () => {
        expect(fs.existsSync(contractPath)).toBe(true);
    });

    test('El contrato tiene id MVP-042', () => {
        expect(contract.id).toBe('MVP-042');
    });

    test('El contrato está en versión 0.1.0-draft', () => {
        expect(contract.version).toBe('0.1.0-draft');
    });

    test('El contrato declara el módulo core/integrity', () => {
        expect(contract.module).toBe('core/integrity');
    });

    test('El contrato incluye criterios de aceptación', () => {
        expect(Array.isArray(contract.acceptance_criteria)).toBe(true);
        expect(contract.acceptance_criteria.length).toBeGreaterThan(0);
    });

    test('El contrato incluye salidas esperadas', () => {
        expect(Array.isArray(contract.outputs)).toBe(true);
        expect(contract.outputs).toContain('public/integrity-report.json');
    });
});
