'use strict';

const fs = require('fs');
const path = require('path');

describe('MVP-053 Compilador Modular', () => {
    const contractPath = path.join(process.cwd(), 'core', 'mvp-053', 'mvp-053-compilador-modular.contract.json');

    test('Existe el contrato MVP-053', () => {
        expect(fs.existsSync(contractPath)).toBe(true);
    });

    test('El contrato tiene id MVP-053', () => {
        const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        expect(contract.id).toBe('MVP-053');
    });

    test('El contrato está en versión 0.1.0-draft', () => {
        const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        expect(contract.version).toMatch(/^(0\.1\.0-draft|1\.0\.0)$/);
    });
});
