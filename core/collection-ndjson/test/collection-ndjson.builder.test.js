'use strict';

const { toNDJSON } = require('../../../scripts/build-collection-export-ndjson');

describe('MVP-036 Collection NDJSON Builder', () => {
    test('toNDJSON genera líneas JSON válidas', () => {
        const catalog = [
            {
                documentId: 'DOC-A',
                title: 'Norma A',
                versions: ['v1', 'v2'],
                createdAt: '2026-09-01T00:00:00Z'
            }
        ];

        const ndjson = toNDJSON(catalog);
        const lineas = ndjson.trim().split(/\r?\n/);

        expect(lineas).toHaveLength(2);
        const primera = JSON.parse(lineas[0]);
        expect(primera.documentId).toBe('DOC-A');
        expect(primera.versionId).toBe('v1');
        expect(primera.url).toBe('/DOC-A/v1/');
    });

    test('toNDJSON respeta documento sin versiones', () => {
        const catalog = [
            {
                documentId: 'DOC-B',
                title: 'Norma B',
                versions: [],
                createdAt: '2026-09-02T00:00:00Z'
            }
        ];

        const ndjson = toNDJSON(catalog).trim();
        const entrada = JSON.parse(ndjson);
        expect(entrada.documentId).toBe('DOC-B');
        expect(entrada.versionId).toBe('');
        expect(entrada.url).toBe('/DOC-B//');
    });
});
