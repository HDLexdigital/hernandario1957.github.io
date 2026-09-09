'use strict';

const fs = require('fs');
const path = require('path');
const { validarJSON } = require('../../../scripts/validate-document-json');

describe('MVP-051 Document Validator Builder', () => {
    const tmpDir = path.join(process.cwd(), 'tmp-test-validator');
    const validPath = path.join(tmpDir, 'valido.json');
    const invalidPath = path.join(tmpDir, 'invalido.json');
    const bomPath = path.join(tmpDir, 'bom.json');

    beforeAll(() => {
        fs.mkdirSync(tmpDir, { recursive: true });
        fs.writeFileSync(validPath, JSON.stringify({ metadata: { title: 'Test' }, content: [] }, null, 2));
        fs.writeFileSync(invalidPath, '{ esto no es json');
        fs.writeFileSync(bomPath, '\uFEFF' + JSON.stringify({ metadata: {}, body: [] }));
    });

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('Acepta documento válido', () => {
        const res = validarJSON(validPath);
        expect(res.status).toBe('OK');
    });

    test('Rechaza JSON inválido', () => {
        const res = validarJSON(invalidPath);
        expect(res.status).toBe('ERROR');
    });

    test('Rechaza documento con BOM', () => {
        const res = validarJSON(bomPath);
        expect(res.status).toBe('ERROR');
    });

    test('Rechaza documento sin metadata', () => {
        const malo = path.join(tmpDir, 'sin-meta.json');
        fs.writeFileSync(malo, JSON.stringify({ content: [] }));
        const res = validarJSON(malo);
        expect(res.status).toBe('ERROR');
    });
});
