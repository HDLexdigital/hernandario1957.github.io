'use strict';

const fs = require('fs');
const path = require('path');

describe('MVP-054-FIX Contract', () => {
    const contractPath = path.join(process.cwd(), 'core', 'mvp-054-fix', 'mvp-054-fix.contract.json');
    let contract;

    beforeAll(() => {
        contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    });

    test('Existe el contrato MVP-054-FIX', () => {
        expect(fs.existsSync(contractPath)).toBe(true);
    });

    test('El contrato tiene id MVP-054-FIX', () => {
        expect(contract.id).toBe('MVP-054-FIX');
    });

    test('El contrato está en versión 0.2.0-draft', () => {
        expect(contract.version).toBe('0.2.0-draft');
    });

    test('El contrato declara el baseline v1.0.2-modular-consolidated', () => {
        expect(contract.baseline).toBe('v1.0.2-modular-consolidated');
    });

    test('El contrato tiene al menos 5 hallazgos', () => {
        expect(contract.hallazgos.length).toBeGreaterThanOrEqual(5);
    });

    test('Cada hallazgo tiene id, prioridad, titulo y tratamiento', () => {
        contract.hallazgos.forEach(h => {
            expect(h.id).toBeTruthy();
            expect(h.prioridad).toBeTruthy();
            expect(h.titulo).toBeTruthy();
            expect(h.tratamiento).toBeTruthy();
        });
    });

    test('El contrato garantiza no modificar baseline', () => {
        expect(contract.guarantees.no_modifica_baseline).toBeTruthy();
    });

    test('El contrato garantiza no introducir funcionalidad nueva', () => {
        expect(contract.guarantees.no_nueva_funcionalidad).toBeTruthy();
    });
});
