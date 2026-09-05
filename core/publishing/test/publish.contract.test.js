'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..', '..', '..');
const PUBLISH_SCRIPT = path.join(RAIZ, 'scripts', 'publish.js');
const LEDM_FIXTURE = path.join(RAIZ, 'core', 'compiler', 'fixtures', 'ledm-expected.json');
const PUBLIC_DIR = path.join(RAIZ, 'public');

describe('MVP-010 Orquestador de Publicación', () => {
    test('El script de publicación existe', () => {
        expect(fs.existsSync(PUBLISH_SCRIPT)).toBe(true);
    });

    test('Genera index.html, manifest.json e indice.json', () => {
        execFileSync('node', [PUBLISH_SCRIPT, LEDM_FIXTURE], { stdio: 'ignore' });

        expect(fs.existsSync(path.join(PUBLIC_DIR, 'index.html'))).toBe(true);
        expect(fs.existsSync(path.join(PUBLIC_DIR, 'manifest.json'))).toBe(true);
        expect(fs.existsSync(path.join(PUBLIC_DIR, 'indice.json'))).toBe(true);
    });

    test('El manifiesto contiene campos obligatorios', () => {
        const manifest = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'manifest.json'), 'utf8'));
        expect(manifest.documentId).toBeDefined();
        expect(manifest.version).toBeDefined();
        expect(manifest.createdAt).toBeDefined();
        expect(Array.isArray(manifest.artifacts)).toBe(true);
    });

    test('El índice contiene nodeId', () => {
        const indice = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'indice.json'), 'utf8'));
        expect(indice.length).toBeGreaterThan(0);
        expect(indice[0].nodeId).toBeDefined();
    });
});
