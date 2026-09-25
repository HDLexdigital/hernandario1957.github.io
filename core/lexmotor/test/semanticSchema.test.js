/**
 * test/semanticSchema.test.js
 * Pruebas Contractuales para C01-04 (Validación Zod Estricta)
 */
const { SemanticTokenSchema } = require('../../../src/validadores/semanticSchema.js');

describe('C01-04 SemanticTokenSchema Contract Tests', () => {

    test('1. Firma Válida: TitleToken pasa la validación', () => {
        const token = {
            sourceStyle: "P01_TITLE_H1",
            semanticClass: "title",
            headingLevel: 1,
            htmlElement: "h1",
            ariaRole: null,
            epubType: "title",
            ariaHidden: null,
            lang: "es-CO"
        };
        expect(() => SemanticTokenSchema.parse(token)).not.toThrow();
    });

    test('2. SEM-08: Falla si headingLevel y htmlElement no coinciden (Equivalencia biunívoca)', () => {
        const tokenInvalido = {
            sourceStyle: "P01_TITLE_H1",
            semanticClass: "title",
            headingLevel: 1,
            htmlElement: "h2", 
            ariaRole: null,
            epubType: "title",
            ariaHidden: null,
            lang: null
        };
        expect(() => SemanticTokenSchema.parse(tokenInvalido)).toThrow(/Equivalencia biunívoca/);
    });

    test('3. Firma Válida: ArticleToken (Legislación) pasa la validación', () => {
        const token = {
            sourceStyle: "P03_ARTICLE",
            semanticClass: "article",
            headingLevel: null,
            htmlElement: "section",
            ariaRole: null,
            epubType: "division", 
            ariaHidden: null,
            lang: null
        };
        expect(() => SemanticTokenSchema.parse(token)).not.toThrow();
    });

    test('4. Strict Mode: Rechaza campos espurios no declarados en el contrato', () => {
        const tokenContaminado = {
            sourceStyle: "P02_CHAPTER",
            semanticClass: "chapter",
            headingLevel: null,
            htmlElement: "section",
            ariaRole: "doc-chapter",
            epubType: "chapter",
            ariaHidden: null,
            lang: null,
            inDesignColor: "#FF0000" 
        };
        expect(() => SemanticTokenSchema.parse(tokenContaminado)).toThrow(/Unrecognized key/);
    });

    test('5. BCP 47: Rechaza códigos de idioma inválidos', () => {
        const token = {
            sourceStyle: "P04_BODY",
            semanticClass: "body",
            headingLevel: null,
            htmlElement: "p",
            ariaRole: null,
            epubType: null,
            ariaHidden: null,
            lang: "idioma-inventado" 
        };
        expect(() => SemanticTokenSchema.parse(token)).toThrow(/estándar BCP 47/);
    });

    test('6. SEM-11: Rechaza token si falta el campo de trazabilidad (sourceStyle)', () => {
        const tokenSinOrigen = {
            semanticClass: "body",
            headingLevel: null,
            htmlElement: "p",
            ariaRole: null,
            epubType: null,
            ariaHidden: null,
            lang: null
        };
        expect(() => SemanticTokenSchema.parse(tokenSinOrigen)).toThrow(/Required/);
    });

    test('7. Falla Estricta (Unión Discriminada): Rechaza mezclas de firmas', () => {
        const tokenMixto = {
            sourceStyle: "P03_ARTICLE_INVENTADO",
            semanticClass: "article",
            headingLevel: null,
            htmlElement: "section",
            ariaRole: "doc-chapter", 
            epubType: "division",
            ariaHidden: null,
            lang: null
        };
        expect(() => SemanticTokenSchema.parse(tokenMixto)).toThrow();
    });
});
