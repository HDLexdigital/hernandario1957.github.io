/**
 * @fileoverview test/unit/uxp/g3-structured-extractor.test.js
 * Pruebas unitarias (TDD) para el contrato estructural del StructuredDocumentExtractor (G3.2.1)
 */
const { extraerDocumentoEstructurado } = require('../../../lexmotor-uxp-plugin/src/extraction/StructuredDocumentExtractor');

describe('G3.2.1 — StructuredDocumentExtractor Contract', () => {
    
    // Mock del DOM de InDesign basado en la sonda real G3.2.1-R0
    const mockInDesignDocument = {
        name: "fragmento.indd",
        stories: [
            {
                paragraphs: [
                    {
                        appliedParagraphStyle: { name: "P01_BODY_BASE" },
                        textStyleRanges: [
                            {
                                contents: "Texto de prueba\r",
                                appliedCharacterStyleName: "[Ninguno]"
                            }
                        ]
                    },
                    {
                        appliedParagraphStyle: { name: "P02_TITLE_PART" },
                        textStyleRanges: [
                            {
                                contents: "Título del documento\r",
                                appliedCharacterStyleName: "EstiloEspecial"
                            }
                        ]
                    }
                ]
            }
        ]
    };

    let resultado;

    beforeAll(() => {
        resultado = extraerDocumentoEstructurado(mockInDesignDocument);
    });

    test('G3.2.1.1 — Existe objeto documento', () => {
        expect(resultado).toHaveProperty('documento');
        expect(typeof resultado.documento).toBe('object');
    });

    test('G3.2.1.2 — documento.titulo es cadena no vacía procedente del nombre', () => {
        expect(resultado.documento.titulo).toBe("fragmento.indd");
        expect(typeof resultado.documento.titulo).toBe('string');
        expect(resultado.documento.titulo.trim().length).toBeGreaterThan(0);
    });

    test('G3.2.1.3 — Existe fragmentos como arreglo en la raíz', () => {
        expect(Array.isArray(resultado.fragmentos)).toBe(true);
        expect(resultado.fragmentos.length).toBe(2);
    });

    test('G3.2.1.4 — Cada elemento de fragmentos representa un párrafo', () => {
        expect(resultado.fragmentos[0]).toHaveProperty('estilo');
        expect(resultado.fragmentos[0]).toHaveProperty('fragmentos');
    });

    test('G3.2.1.5 — El estilo procede literalmente de appliedParagraphStyle.name', () => {
        expect(resultado.fragmentos[0].estilo).toBe("P01_BODY_BASE");
        expect(resultado.fragmentos[1].estilo).toBe("P02_TITLE_PART");
    });

    test('G3.2.1.6 — Cada párrafo conserva su subarreglo de fragmentos (runs)', () => {
        expect(Array.isArray(resultado.fragmentos[0].fragmentos)).toBe(true);
        expect(resultado.fragmentos[0].fragmentos.length).toBe(1);
    });

    test('G3.2.1.7 — Cada run conserva contents mapeado a texto', () => {
        expect(resultado.fragmentos[0].fragmentos[0]).toHaveProperty('texto');
        expect(resultado.fragmentos[0].fragmentos[0].texto).toBe("Texto de prueba\r");
    });

    test('G3.2.1.8 — Cada run conserva appliedCharacterStyleName mapeado a estiloCaracter', () => {
        expect(resultado.fragmentos[0].fragmentos[0]).toHaveProperty('estiloCaracter', "[Ninguno]");
        expect(resultado.fragmentos[1].fragmentos[0]).toHaveProperty('estiloCaracter', "EstiloEspecial");
    });

    test('G3.2.1.9 — Se conserva el caracter de salto de línea \\r tal como lo entrega InDesign', () => {
        expect(resultado.fragmentos[0].fragmentos[0].texto.endsWith('\r')).toBe(true);
    });

    test('G3.2.1.10 — El extractor NO genera la propiedad tipoNodo', () => {
        const jsonString = JSON.stringify(resultado);
        expect(jsonString).not.toContain('tipoNodo');
    });

    test('G3.2.1.11 — El extractor NO genera la propiedad contenido', () => {
        const jsonString = JSON.stringify(resultado);
        expect(jsonString).not.toContain('"contenido"');
    });

    test('G3.2.1.12 — El extractor NO ejecuta ninguna transformación ni validación de E10/Core', () => {
        // Ninguno de los objetos de salida debe tener propiedades añadidas por la Baseline
        expect(resultado.documento).not.toHaveProperty('valid');
        expect(resultado.fragmentos[0]).not.toHaveProperty('inDesignStyle');
    });
});