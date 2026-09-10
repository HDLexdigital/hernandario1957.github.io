'use strict';

const { buildExport } = require('../../../src/core/compiladores/exports');

describe('MVP-033 Collection Export Builder', () => {
    test('buildExport combina catálogo, timeline y métricas', () => {
        const catalog = [{ documentId: 'DOC-A' }];
        const timeline = [{ createdAt: '2026-09-01T00:00:00Z', title: 'Evento' }];
        const metrics = { totalDocuments: 1, totalVersions: 1 };

        const result = buildExport(catalog, timeline, metrics);

        expect(result).toHaveProperty('exportedAt');
        expect(result.catalog).toEqual(catalog);
        expect(result.timeline).toEqual(timeline);
        expect(result.metrics).toEqual(metrics);
    });

    test('buildExport incluye timestamp UTC válido', () => {
        const result = buildExport([], [], {});
        const date = new Date(result.exportedAt);
        expect(date instanceof Date && !isNaN(date)).toBe(true);
    });
});
