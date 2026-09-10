'use strict';

const { toCSV } = require('../../../src/core/compiladores/exports');

describe('MVP-034 Collection CSV Builder', () => {
    test('toCSV genera cabecera y filas', () => {
        const catalog = [
            {
                documentId: 'DOC-A',
                title: 'Norma A',
                versions: ['v1', 'v2'],
                createdAt: '2026-09-01T00:00:00Z'
            }
        ];

        const csv = toCSV(catalog);
        expect(csv).toContain('documentId,title,versionId,createdAt,url');
        expect(csv).toContain('DOC-A,Norma A,v1,2026-09-01T00:00:00Z,/DOC-A/v1/');
        expect(csv).toContain('DOC-A,Norma A,v2,2026-09-01T00:00:00Z,/DOC-A/v2/');
    });

    test('toCSV escapa campos con comillas', () => {
        const catalog = [
            {
                documentId: 'DOC-B',
                title: 'Norma "Especial", con coma',
                versions: ['v1'],
                createdAt: ''
            }
        ];

        const csv = toCSV(catalog);
        expect(csv).toContain('"Norma ""Especial"", con coma"');
    });
});
