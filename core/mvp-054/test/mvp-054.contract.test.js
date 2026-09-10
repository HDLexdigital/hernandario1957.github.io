'use strict';

const fs = require('fs');
const path = require('path');

describe('MVP-054 XHTML LEDM', () => {
    const contractPath = path.join(process.cwd(), 'core', 'mvp-054', 'mvp-054-xhtml-ledm.contract.json');

    test('Existe el contrato MVP-054', () => {
        expect(fs.existsSync(contractPath)).toBe(true);
    });

    test('El contrato tiene id MVP-054', () => {
        const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        expect(contract.id).toBe('MVP-054');
    });

    test('El contrato está en versión 0.1.0-draft', () => {
        const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        expect(contract.version).toMatch(/^(0\.1\.0-draft|1\.0\.0)$/);
    });
});
