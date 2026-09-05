'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..', '..', '..');
const PUBLISH_SCRIPT = path.join(RAIZ, 'scripts', 'publish.js');
const LEDM_FIXTURE = path.join(RAIZ, 'core', 'compiler', 'fixtures', 'ledm-expected.json');
const PUBLIC_DIR = path.join(RAIZ, 'public');

describe('MVP-010 Orquestador de Publicación Real', () => {
    beforeAll(() => {
        execFileSync('node', [PUBLISH_SCRIPT, LEDM_FIXTURE], { stdio: 'ignore' });
    }, 30000);

    test('Genera artefactos web, epub y PDF', () => {
        expect(fs.existsSync(path.join(PUBLIC_DIR, 'index.html'))).toBe(true);
        expect(fs.existsSync(path.join(PUBLIC_DIR, 'documento.epub'))).toBe(true);
        expect(fs.existsSync(path.join(PUBLIC_DIR, 'documento-ua.pdf'))).toBe(true);
        expect(fs.existsSync(path.join(PUBLIC_DIR, 'documento-print.pdf'))).toBe(true);
    });

    test('El manifiesto contiene todos los artefactos con checksum', () => {
        const manifest = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'manifest.json'), 'utf8'));
        expect(manifest.documentId).toBeDefined();
        expect(Array.isArray(manifest.artifacts)).toBe(true);
        expect(manifest.artifacts.length).toBeGreaterThanOrEqual(4);
        manifest.artifacts.forEach(art => {
            expect(art.checksum).toMatch(/^[a-f0-9]{64}$/);
        });
    });

    test('El índice contiene nodeId', () => {
        const indice = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'indice.json'), 'utf8'));
        expect(indice.length).toBeGreaterThan(0);
        expect(indice[0].nodeId).toBeDefined();
    });
});
