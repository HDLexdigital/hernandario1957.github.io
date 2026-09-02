/**
 * E22.5.2 — EPUB3 Navigation Document Contract Suite
 * 
 * Fase: GREEN (Tras corrección de helper)
 * 
 * Contrato de la Tabla de Contenido Accesible (nav.xhtml):
 * - Genera un documento XHTML válido para la navegación.
 * - Incluye obligatoriamente el elemento <nav epub:type="toc" id="toc">.
 * - Contiene una lista ordenada (<ol>) con los enlaces (<a>) hacia los artículos del corpus.
 * - Respeta la inmutabilidad y no altera los datos de entrada.
 */

'use strict';

const EpubNavGenerator = require('../../../src/validadores/E22/EpubNavGenerator');

describe('E22.5.2 — EPUB3 Navigation Document Contract', () => {

    const mockTocItems = Object.freeze([
        { id: 'ART_1', label: 'Artículo 1', href: 'corpus-lexdigital.xhtml#ART_1' },
        { id: 'ART_2', label: 'Artículo 2', href: 'corpus-lexdigital.xhtml#ART_2' }
    ]);

    test('1. NAV STRUCTURE: Genera un documento XHTML con el landmark toc obligatorio de EPUB 3', () => {
        const navHtml = EpubNavGenerator.generateNav(mockTocItems);

        expect(navHtml).toMatch(/xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/);
        expect(opfNamespaceCheck(navHtml, /epub:type="toc"/)).toBe(true);
        expect(navHtml).toMatch(/<nav\b[^>]*id="toc"[^>]*>/);
    });

    test('2. TOC ITEMS: Renderiza la lista ordenada de enlaces conforme a los ítems del corpus', () => {
        const navHtml = EpubNavGenerator.generateNav(mockTocItems);

        expect(navHtml).toMatch(/<ol>/);
        expect(navHtml).toMatch(/<a\b[^>]*href="corpus-lexdigital\.xhtml#ART_1"[^>]*>Artículo 1<\/a>/);
        expect(navHtml).toMatch(/<a\b[^>]*href="corpus-lexdigital\.xhtml#ART_2"[^>]*>Artículo 2<\/a>/);
    });

    test('3. VALIDATION: Lanza error si la lista de elementos está vacía o es inválida', () => {
        expect(() => {
            EpubNavGenerator.generateNav([]);
        }).toThrow(/EPUB_NAV_VIOLATION/);
    });

});

// Función auxiliar de apoyo al test
function opfNamespaceCheck(html, regex) {
    return regex.test(html) || html.includes('epub:type="toc"');
}