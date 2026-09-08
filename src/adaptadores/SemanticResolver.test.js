/**
 * Pruebas Unitarias para SemanticResolver.js
 */
const { indexSemanticMap, resolveStyleName, _sanitizeSelector } = require('./SemanticResolver.js');

describe('SemanticResolver - Unit Tests', () => {

    describe('_sanitizeSelector', () => {
        test('debe anteponer "estilo-" si el selector empieza con número', () => {
            expect(_sanitizeSelector('01 Cuerpo de Texto')).toBe('estilo-01-cuerpo-de-texto');
            expect(_sanitizeSelector('02_TITULOS')).toBe('estilo-02_titulos');
        });

        test('debe limpiar caracteres especiales y tildes', () => {
            expect(_sanitizeSelector('[Basic Paragraph]')).toBe('basic-paragraph');
            expect(_sanitizeSelector('Artículo (Nivel 1)')).toBe('articulo-nivel-1');
        });
    });

    describe('resolveStyleName - Precedencia e Invariantes', () => {
        const mockIndexedSemantic = {
            "P01_BODY_CONT": { tag: null, className: "cuerpo-siguiente" },
            "P02_TITLE_CHAPTER": { tag: "h2", className: "capitulo" }
        };

        const mockProfileStyleMap = {
            "P01_BODY_BASE": { tag: "p", class: "articulo" }
        };

        test('Prioridad 1: Perfil (style-map.json) sobre InDesign', () => {
            const res = resolveStyleName("P01_BODY_BASE", false, mockProfileStyleMap, mockIndexedSemantic);
            expect(res.resolvedTag).toBe("p");
            expect(res.resolvedClass).toBe("articulo");
        });

        test('Prioridad 2: InDesign exportTagging cuando no hay regla en el Perfil', () => {
            const res = resolveStyleName("P02_TITLE_CHAPTER", false, mockProfileStyleMap, mockIndexedSemantic);
            expect(res.resolvedTag).toBe("h2");
            expect(res.resolvedClass).toBe("capitulo");
        });

        test('Prioridad 3: Fallback sanitizado', () => {
            const res = resolveStyleName("P03_CENTER_BOLD", false, mockProfileStyleMap, mockIndexedSemantic);
            expect(res.resolvedTag).toBe("p");
            expect(res.resolvedClass).toBe("p03_center_bold");
        });

        test('Invariante [Ninguno] / None: resolvedTag = null y resolvedClass = null', () => {
            expect(resolveStyleName("[Ninguno]", true, mockProfileStyleMap, mockIndexedSemantic)).toEqual({
                styleName: "[Ninguno]",
                resolvedTag: null,
                resolvedClass: null
            });
        });
    });
});