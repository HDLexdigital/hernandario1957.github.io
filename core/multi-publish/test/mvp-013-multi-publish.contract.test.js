'use strict';

const contract = require('../mvp-013-multi-publish.contract.json');

describe('MVP-013 Multi-Publish Contract', () => {
    test('El contrato define publicación multi-documento y solo lectura', () => {
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.multiDocument).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('La entrada exige al menos un documento LEDM', () => {
        expect(contract.input.minDocuments).toBeGreaterThanOrEqual(1);
        expect(contract.input.accept).toContain('json');
    });

    test('La salida define raíz pública e índice global', () => {
        expect(contract.output.root).toBe('public');
        expect(contract.output.globalIndex).toBe('public/indice-general.json');
    });

    test('Cada documento requiere manifiesto e índice', () => {
        expect(contract.perDocument.required).toEqual(
            expect.arrayContaining(['index.html', 'manifest.json', 'indice.json'])
        );
    });

    test('La validación exige todos los documentos y checksums', () => {
        expect(contract.validation.requireAllDocuments).toBe(true);
        expect(contract.validation.requireGlobalIndex).toBe(true);
        expect(contract.validation.requirePerDocumentManifest).toBe(true);
        expect(contract.validation.requireChecksums).toBe(true);
        expect(contract.validation.failOnMissing).toBe(true);
    });
});
