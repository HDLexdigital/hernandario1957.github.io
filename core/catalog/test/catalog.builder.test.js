'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..', '..', '..');
const SCRIPT = path.join(RAIZ, 'scripts', 'build-catalog.js');
const CATALOGO_PATH = path.join(RAIZ, 'public', 'catalogo.json');

describe('MVP-014 Catalog Builder', () => {
    beforeAll(() => {
        execFileSync('node', [SCRIPT], { stdio: 'ignore' });
    });

    test('Genera catálogo global', () => {
        expect(fs.existsSync(CATALOGO_PATH)).toBe(true);
    });

    test('El catálogo contiene el documento versionado', () => {
        const catalogo = JSON.parse(fs.readFileSync(CATALOGO_PATH, 'utf8'));
        const doc = catalogo.find(entry => entry.documentId === 'NORMA-VERSIONADA');
        expect(doc).toBeDefined();
        expect(doc.versions).toEqual(expect.arrayContaining(['v1', 'v2']));
    });

    test('Las versiones están ordenadas', () => {
        const catalogo = JSON.parse(fs.readFileSync(CATALOGO_PATH, 'utf8'));
        const doc = catalogo.find(entry => entry.documentId === 'NORMA-VERSIONADA');
        expect(doc.versions).toEqual(['v1', 'v2']);
    });
});
