/**
 * test/compilarLexmotor.test.js
 * Pruebas de Integración y Validación Jest para compilarLexmotor()
 */

const { compilarLexmotor, enriquecerTokens } = require('../../../src/compiladores/compilarLexmotor.js');
const { indexSemanticMap } = require('../../../src/adaptadores/SemanticResolver.js');

describe('compilarLexmotor() - Integration & Validation Tests', () => {

    const mockProfileStyleMap = {
        "P01_BODY_BASE": { tag: "p", class: "articulo" }
    };

    const mockSemanticMapInDesign = {
        document: "fragmento.indd",
        styles: [
            {
                originalName: "P01_BODY_CONT",
                type: "paragraph",
                exportTagging: { epub: { tag: "p", className: "cuerpo-siguiente" } }
            },
            {
                originalName: "TerminoGlosario",
                type: "character",
                exportTagging: { epub: { tag: "span", className: "termino-glosario" } }
            }
        ]
    };

    const indexedSemantic = indexSemanticMap(mockSemanticMapInDesign);

    test('1. Carga opcional de semantic_map.json e indexación única', () => {
        const jsonCrudo = {
            tokens: [
                { tipoNodo: "paragraph", inDesignStyle: "P01_BODY_CONT", texto: "Prueba sin semanticMap" }
            ]
        };

        const resSinSemantic = compilarLexmotor(jsonCrudo, "fragmento", { rutaSemanticMap: "/ruta/inexistente.json" });
        expect(resSinSemantic.success).toBe(true);
    });

    test('2. Resolución de párrafos y character runs con estilo GREP', () => {
        const jsonCrudo = {
            tokens: [
                {
                    tipoNodo: "paragraph",
                    inDesignStyle: "P01_BODY_CONT",
                    contenido: [
                        { tipoNodo: "character", texto: "Artículo 3. La ", estiloCaracter: "[Ninguno]" },
                        { tipoNodo: "character", texto: "soberanía", estiloCaracter: "TerminoGlosario" },
                        { tipoNodo: "character", texto: " reside en el ", estiloCaracter: "[Ninguno]" },
                        { tipoNodo: "character", texto: "poder público", estiloCaracter: "TerminoGlosario" },
                        { tipoNodo: "character", texto: ".", estiloCaracter: "[Ninguno]" }
                    ]
                }
            ]
        };

        const res = compilarLexmotor(jsonCrudo, "fragmento", {});
        const html = res.xhtml;

        expect(html).toBe(
            '<p class="cuerpo-siguiente">Artículo 3. La <span class="termino-glosario">soberanía</span> reside en el <span class="termino-glosario">poder público</span>.</p>'
        );
    });

    test('3. Precedencia: Profile (style-map.json) sobre InDesign y Fallback', () => {
        const tokensOriginales = [
            { tipoNodo: "paragraph", inDesignStyle: "P01_BODY_BASE", texto: "Texto Base" },
            { tipoNodo: "paragraph", inDesignStyle: "P03_CENTER_BOLD", texto: "Centro Negrita" }
        ];

        const enriquecidos = enriquecerTokens(tokensOriginales, mockProfileStyleMap, indexedSemantic);

        expect(enriquecidos[0].resolvedClass).toBe("articulo");
        expect(enriquecidos[1].resolvedClass).toBe("p03_center_bold");
    });

    test('4. Invariante AST: Preservación de inDesignStyle y No Mutación', () => {
        const tokenOriginal = {
            tipoNodo: "paragraph",
            inDesignStyle: "P01_BODY_CONT",
            contenido: [{ tipoNodo: "character", texto: "Prueba", estiloCaracter: "TerminoGlosario" }]
        };

        enriquecerTokens([tokenOriginal], mockProfileStyleMap, indexedSemantic);

        expect(tokenOriginal.resolvedTag).toBeUndefined();
        expect(tokenOriginal.resolvedClass).toBeUndefined();
        expect(tokenOriginal.inDesignStyle).toBe("P01_BODY_CONT");
    });

    test('5. Validación estricta (Zod): Rechaza JSON de entrada mal formado', () => {
        const jsonInvalido = {
            tokens: [
                { tipoNodo: "tipoInvalidoDesconocido", texto: "Error esperado" }
            ]
        };

        expect(() => {
            compilarLexmotor(jsonInvalido, "fragmento", {});
        }).toThrow();
    });
});
