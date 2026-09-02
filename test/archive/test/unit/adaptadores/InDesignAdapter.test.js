const fs = require('fs');
const path = require('path');
const os = require('os');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E10 — InDesignAdapter (Capa Anticorrupción)', () => {
    let jsonCrudoInDesign;
    let semanticMapInDesign;

    beforeEach(() => {
        // Simulación del JSON exportado por los scripts actuales de InDesign (usando "fragmentos")
        jsonCrudoInDesign = {
            documento: "DocumentoProduccion.indd",
            fragmentos: [ // E10.1: InDesign usa 'fragmentos'
                {
                    tipoNodo: "paragraph",
                    estiloParrafo: "P01_BODY_BASE",
                    inDesignStyle: "P01_BODY_BASE",
                    fragmentos: [ // Anidación típica de InDesign
                        {
                            tipoNodo: "character",
                            texto: "Texto crudo con < & >",
                            estiloCaracter: "[Ninguno]", // E10.3: Debe conservarse
                            inDesignStyle: "[Ninguno]"
                        },
                        {
                            tipoNodo: "character",
                            texto: "Término",
                            estiloCaracter: "TerminoGlosario",
                            inDesignStyle: "TerminoGlosario"
                        }
                    ]
                }
            ]
        };

        // Simulación del Mapa Semántico generado por StyleModelBuilder
        semanticMapInDesign = {
            documentName: "DocumentoProduccion.indd",
            styles: [
                {
                    originalName: "P01_BODY_BASE",
                    type: "paragraph",
                    exportTagging: { epub: { tag: "p", className: "body-base" } }
                },
                {
                    originalName: "TerminoGlosario",
                    type: "character",
                    exportTagging: { epub: { tag: "span", className: "glosario" } }
                }
            ]
        };
    });

    test('E10.1 - Transforma "fragmentos" en el "contenido" canónico del AST', () => {
        const resultado = adaptarInDesign({ jsonCrudo: jsonCrudoInDesign, semanticMap: semanticMapInDesign });
        
        expect(resultado.ast.fragmentos).toBeUndefined();
        expect(resultado.ast.contenido).toBeDefined();
        expect(Array.isArray(resultado.ast.contenido)).toBe(true);
        expect(resultado.ast.contenido[0].contenido).toBeDefined(); // Fragmentos anidados también se convierten
    });

    test('E10.2 & E10.3 - Preserva estilos originales y [Ninguno] sin mutar', () => {
        const resultado = adaptarInDesign({ jsonCrudo: jsonCrudoInDesign, semanticMap: semanticMapInDesign });
        
        const runNinguno = resultado.ast.contenido[0].contenido[0];
        expect(runNinguno.estiloCaracter).toBe('[Ninguno]');
        expect(runNinguno.inDesignStyle).toBe('[Ninguno]');
    });

    test('E10.4 & E10.5 - Preservación textual byte por byte sin escape XHTML temprano', () => {
        const resultado = adaptarInDesign({ jsonCrudo: jsonCrudoInDesign, semanticMap: semanticMapInDesign });
        
        const runEspecial = resultado.ast.contenido[0].contenido[0];
        expect(runEspecial.texto).toBe('Texto crudo con < & >'); // E4 se encargará del escape
    });

    test('E10.6 & E10.7 - Genera el StyleBridge (Puente CSS) y preserva el Semantic Map', () => {
        const resultado = adaptarInDesign({ jsonCrudo: jsonCrudoInDesign, semanticMap: semanticMapInDesign });
        
        expect(resultado.semanticMap.styles.length).toBe(2);
        
        // El puente CSS debe mapear la clase InDesign con la clase semántica
        expect(resultado.styleBridge).toEqual({
            "P01_BODY_BASE": "body-base",
            "TerminoGlosario": "glosario"
        });
    });

    test('E10.8 - Diagnóstico de estilos inexistentes (Unmapped Styles)', () => {
        // Inyectamos un estilo huérfano en el JSON de entrada
        jsonCrudoInDesign.fragmentos.push({
            tipoNodo: "paragraph",
            estiloParrafo: "P99_DESCONOCIDO",
            inDesignStyle: "P99_DESCONOCIDO",
            fragmentos: [{ tipoNodo: "character", texto: "X", estiloCaracter: "[Ninguno]" }]
        });

        const resultado = adaptarInDesign({ jsonCrudo: jsonCrudoInDesign, semanticMap: semanticMapInDesign });
        
        expect(resultado.diagnostics.valid).toBe(false); // Hay discrepancias
        expect(resultado.diagnostics.unmappedParagraphStyles).toContain("P99_DESCONOCIDO");
        expect(resultado.diagnostics.warnings.length).toBeGreaterThan(0);
    });

    test('G3.5-T4 - Inyecta semántica base sin sobrescribir tipo existente', () => {
        jsonCrudoInDesign.fragmentos[0].tipo = 'articulo';
        jsonCrudoInDesign.fragmentos.push({
            tipoNodo: 'paragraph',
            estiloParrafo: 'P01_BODY_CONT',
            fragmentos: [{ tipoNodo: 'character', texto: 'Continuación', estiloCaracter: '[Ninguno]' }]
        });

        const resultado = adaptarInDesign({ jsonCrudo: jsonCrudoInDesign, semanticMap: semanticMapInDesign });

        expect(resultado.ast.contenido[0].tipo).toBe('articulo');
        expect(resultado.ast.contenido[1].tipo).toBe('parrafo');
        expect(jsonCrudoInDesign.fragmentos[1].tipo).toBeUndefined();
    });
    test('E10.9 & E10.10 - Determinismo y Aislamiento', () => {
        const jsonA = JSON.parse(JSON.stringify(jsonCrudoInDesign));
        const jsonB = JSON.parse(JSON.stringify(jsonCrudoInDesign));
        jsonB.documento = "OtroDoc.indd";

        const resultadoA = adaptarInDesign({ jsonCrudo: jsonA, semanticMap: semanticMapInDesign });
        const resultadoB = adaptarInDesign({ jsonCrudo: jsonB, semanticMap: semanticMapInDesign });

        expect(resultadoA.ast.documento).toBe("DocumentoProduccion.indd");
        expect(resultadoB.ast.documento).toBe("OtroDoc.indd");
        expect(resultadoA).not.toBe(resultadoB); // Diferentes referencias en memoria
    });
});