'use strict';

const contract = require('../mvp-007-pdf-publication.contract.json');

describe('MVP-007 PDF Publication Contract', () => {
    test('El contrato define tipos LEDM compatibles', () => {
        expect(contract.allowedBlockTypes).toEqual(['title', 'article', 'paragraph']);
        expect(contract.allowedInlineTypes).toEqual(['strong', 'emphasis', 'text']);
    });

    test('La paginación define formato y control de viudas/huérfanas', () => {
        expect(contract.pagination.format).toBe('A4');
        expect(contract.pagination.widowControl).toBe(true);
        expect(contract.pagination.orphanControl).toBe(true);
        expect(contract.pagination.breakInsideAvoid).toEqual(['article']);
    });

    test('La fidelidad prohíbe mutar el LEDM y exige preservar orden y nodeIds', () => {
        expect(contract.fidelity.mutateLedm).toBe(false);
        expect(contract.fidelity.preserveText).toBe(true);
        expect(contract.fidelity.preserveOrder).toBe(true);
        expect(contract.fidelity.preserveNodeIds).toBe(true);
    });

    test('Los elementos estáticos están configurados sin inventar semántica aún', () => {
        expect(contract.staticElements.runningHeader.enabled).toBe(true);
        expect(contract.staticElements.folio.enabled).toBe(true);
        expect(contract.staticElements.footnotes.enabled).toBe(true);
        expect(contract.staticElements.footnotes.rule).toBe('future-ledm');
    });

    test('Los metadatos exigen PDF marcado', () => {
        expect(contract.metadata.marked).toBe(true);
        expect(contract.metadata.language).toBe('es-CO');
    });

    test('Los bookmarks se generan desde la estructura LEDM', () => {
        expect(contract.bookmarks.enabled).toBe(true);
        expect(contract.bookmarks.source).toBe('ledm.structure.blocks');
        expect(contract.bookmarks.nodeIdAsKey).toBe(true);
        expect(contract.bookmarks.visibleText).toBe('derived-from-ledm');
    });

    test('La validación incluye PDF/UA, texto y metadatos', () => {
        expect(contract.validation.pdfua.required).toBe(true);
        expect(contract.validation.text.compareWithLedm).toBe(true);
        expect(contract.validation.metadata.check).toContain('Marked');
    });
});