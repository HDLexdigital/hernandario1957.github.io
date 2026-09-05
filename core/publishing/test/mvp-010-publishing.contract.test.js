
'use strict';

const contract = require('../mvp-010-publishing.contract.json');

describe('MVP-010 Publishing Contract', () => {
    test('El contrato define entrada LEDM y salidas por renderizador', () => {
        expect(contract.input.type).toBe('LEDM 2.0');
        expect(contract.outputTargets.web.renderer).toBe('core/web/WebRenderer.js');
        expect(contract.outputTargets.epub.renderer).toBe('core/epub/EpubGenerator.js');
        expect(contract.outputTargets['pdf-ua'].bundle).toEqual(['base.css', 'paged-media.css']);
        expect(contract.outputTargets['pdf-print'].bundle).toEqual([
            'base.css',
            'paged-media.css',
            'print.css'
        ]);
    });

    test('La distribución define raíz pública, manifiesto e índice', () => {
        expect(contract.distribution.root).toBe('public');
        expect(contract.distribution.manifest).toBe('manifest.json');
        expect(contract.distribution.normativeIndex).toBe('indice.json');
    });

    test('El manifiesto exige campos obligatorios y checksums', () => {
        expect(contract.manifest.requiredFields).toEqual(
            expect.arrayContaining(['documentId', 'version', 'createdAt', 'artifacts'])
        );
        expect(contract.manifest.artifactFields).toEqual(
            expect.arrayContaining(['type', 'path', 'checksum', 'rendererVersion'])
        );
    });

    test('La validación obliga a todos los artefactos y checksums', () => {
        expect(contract.validation.requireAllArtifacts).toBe(true);
        expect(contract.validation.requireManifest).toBe(true);
        expect(contract.validation.requireIndex).toBe(true);
        expect(contract.validation.requireChecksums).toBe(true);
        expect(contract.validation.failOnMissing).toBe(true);
    });
});
