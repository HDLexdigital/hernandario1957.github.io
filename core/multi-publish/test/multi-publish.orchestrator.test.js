'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..', '..', '..');
const SCRIPT = path.join(RAIZ, 'scripts', 'publish-multi.js');
const PUBLIC_DIR = path.join(RAIZ, 'public');

describe('MVP-013 Multi-Publish Orchestrator', () => {
    beforeAll(() => {
        execFileSync('node', [SCRIPT], { stdio: 'ignore' });
    }, 60000);

    test('Genera índice global', () => {
        expect(fs.existsSync(path.join(PUBLIC_DIR, 'indice-general.json'))).toBe(true);
    });

    test('Cada documento tiene carpeta con manifiesto e índice', () => {
        const docs = ['DOC-A', 'DOC-B'];
        for (const doc of docs) {
            expect(fs.existsSync(path.join(PUBLIC_DIR, doc, 'index.html'))).toBe(true);
            expect(fs.existsSync(path.join(PUBLIC_DIR, doc, 'manifest.json'))).toBe(true);
            expect(fs.existsSync(path.join(PUBLIC_DIR, doc, 'indice.json'))).toBe(true);
        }
    });

    test('El índice general contiene ambos documentos', () => {
        const indiceGeneral = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'indice-general.json'), 'utf8'));
        expect(indiceGeneral.length).toBeGreaterThanOrEqual(2);
        const ids = indiceGeneral.map(entry => entry.documentId);
        expect(ids).toEqual(expect.arrayContaining(['DOC-A', 'DOC-B']));
    });

    test('Los manifiestos locales contienen artefactos y checksums', () => {
        for (const doc of ['DOC-A', 'DOC-B']) {
            const manifest = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, doc, 'manifest.json'), 'utf8'));
            expect(manifest.documentId).toBe(doc);
            expect(Array.isArray(manifest.artifacts)).toBe(true);
            manifest.artifacts.forEach(artifact => {
                expect(artifact.checksum).toMatch(/^[a-f0-9]{64}$/);
            });
        }
    });
});
