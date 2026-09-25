/**
 * test/constructorXHTML.test.js
 * TDD: Pruebas de Proyección Pasiva para el Constructor XHTML
 */
const { construirNodoXHTML } = require('../../../src/constructores/constructorXHTML.js');

describe('Constructor XHTML - Proyección Pasiva (C01-04)', () => {
    
    // Mock de contenido interno para las pruebas
    const contenidoHijo = "Texto de prueba";

    test('1. TitleToken en Perfil EPUB: Serializa epub:type y lang, omite atributos null', () => {
        const token = {
            semanticClass: 'title',
            headingLevel: 2,
            htmlElement: 'h2',
            ariaRole: null,
            epubType: 'title',
            ariaHidden: null,
            lang: 'es-CO',
            texto: contenidoHijo
        };
        const resultado = construirNodoXHTML(token, { perfil: 'EPUB' });
        expect(resultado).toBe('<h2 epub:type="title" lang="es-CO">Texto de prueba</h2>');
    });

    test('2. TitleToken en Perfil WEB: Suprime epub:type pero mantiene lang', () => {
        const token = {
            semanticClass: 'title',
            headingLevel: 2,
            htmlElement: 'h2',
            ariaRole: null,
            epubType: 'title',
            ariaHidden: null,
            lang: 'es-CO',
            texto: contenidoHijo
        };
        const resultado = construirNodoXHTML(token, { perfil: 'WEB' });
        // En WEB, epub:type desaparece
        expect(resultado).toBe('<h2 lang="es-CO">Texto de prueba</h2>');
    });

    test('3. ChapterToken en Perfil WEB: Serializa role, suprime epub:type', () => {
        const token = {
            semanticClass: 'chapter',
            headingLevel: null,
            htmlElement: 'section',
            ariaRole: 'doc-chapter',
            epubType: 'chapter',
            ariaHidden: null,
            lang: null,
            texto: contenidoHijo
        };
        const resultado = construirNodoXHTML(token, { perfil: 'WEB' });
        expect(resultado).toBe('<section role="doc-chapter">Texto de prueba</section>');
    });

    test('4. ArticleToken en Perfil EPUB: Serializa epub:type="division", ariaRole ausente', () => {
        const token = {
            semanticClass: 'article',
            headingLevel: null,
            htmlElement: 'section',
            ariaRole: null,
            epubType: 'division',
            ariaHidden: null,
            lang: null,
            texto: contenidoHijo
        };
        const resultado = construirNodoXHTML(token, { perfil: 'EPUB' });
        expect(resultado).toBe('<section epub:type="division">Texto de prueba</section>');
    });

    test('5. DecorativeToken: Serializa aria-hidden="true" en ambos perfiles', () => {
        const token = {
            semanticClass: 'decorative',
            headingLevel: null,
            htmlElement: 'span',
            ariaRole: null,
            epubType: null,
            ariaHidden: true,
            lang: null,
            texto: contenidoHijo
        };
        const resultadoWeb = construirNodoXHTML(token, { perfil: 'WEB' });
        const resultadoEpub = construirNodoXHTML(token, { perfil: 'EPUB' });
        
        expect(resultadoWeb).toBe('<span aria-hidden="true">Texto de prueba</span>');
        expect(resultadoEpub).toBe('<span aria-hidden="true">Texto de prueba</span>');
    });

    test('6. Falla Segura: Lanza error si el perfil no es WEB o EPUB', () => {
        const token = {
            semanticClass: 'body',
            htmlElement: 'p',
            texto: contenidoHijo
        };
        expect(() => construirNodoXHTML(token, { perfil: 'INVALIDO' })).toThrow(/Perfil de salida desconocido/);
        expect(() => construirNodoXHTML(token)).toThrow(/Perfil de salida requerido/);
    });
});
