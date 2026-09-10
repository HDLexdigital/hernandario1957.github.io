'use strict';

const fs = require('fs');
const path = require('path');

describe('MVP-049 Audit Summary Contract', () => {
    const contractPath = path.join(process.cwd(), 'core', 'audit-summary', 'mvp-049-audit-summary.contract.json');
    let contract;

    beforeAll(() => {
        contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    });

    test('Existe el contrato MVP-049', () => {
        expect(fs.existsSync(contractPath)).toBe(true);
    });

    test('El contrato tiene id MVP-049', () => {
        expect(contract.id).toBe('MVP-049');
    });

    test('El contrato está en versión 0.1.0-draft', () => {
        expect(contract.version).toMatch(/^(0\.1\.0-draft|1\.0\.0)$/);
    });

    test('El contrato declara el módulo core/audit-summary', () => {
        expect(contract.module).toBe('core/audit-summary');
    });

    test('El contrato incluye criterios de aceptación', () => {
        expect(Array.isArray(contract.acceptance_criteria)).toBe(true);
        expect(contract.acceptance_criteria.length).toBeGreaterThan(0);
    });

    test('El contrato incluye salidas esperadas', () => {
        expect(Array.isArray(contract.outputs)).toBe(true);
        expect(contract.outputs).toContain('public/audit-summary.json');
    });
});
