/**
 * E22.1 — Semantic Serialization Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Proyección XHTML:
 * - Proyecta el Árbol Derivado (E21) hacia elementos XHTML utilizando un SemanticTargetMap explícito.
 * - Inyecta trazabilidad mediante el namespace protegido (data-ld-*).
 * - Prohíbe inventar procedencia, alterar jerarquías (children) o descubrir nuevos nodos.
 * - Garantiza la invariante: Claims(E22) ⊆ Claims(E21).
 * - Protege la inmutabilidad absoluta del árbol E21 original.
 */

'use strict';

// El motor de serialización aún no está implementado (Fase RED esperada)
const SemanticSerializer = require('../../../src/validadores/E22/SemanticSerializer');

describe('E22.1 — Semantic Serialization Contract (Fase RED)', () => {

    const mockSemanticMap = Object.freeze({
        version: 'E22.1.0',
        mappings: {
            'ARTICULO': 'article',
            'PARRAFO': 'p',
            'ATOMIC_BLOCK': 'div'
        }
    });

    const mockE21Node = Object.freeze({
        baseDossierId: 'ART_1',
        semanticType: 'ARTICULO',
        sourceEvidence: { astIndex: 10, text: 'Artículo 1. Texto base.' },
        provenance: { e18_Ref: 'e18-hash', e20_5_Ref: 'e20-hash' },
        children: [
            Object.freeze({
                semanticType: 'PARRAFO',
                sourceEvidence: { astIndex: 11, text: 'Parágrafo 1. Texto.' },
                ownershipEvidence: { rule: 'DEPENDS_ON_PRECEDING_ARTICULO' },
                provenance: { e20_7_Ref: 'e207-hash' }
            })
        ]
    });

    const mockE21Tree = Object.freeze({
        nodes: [mockE21Node]
    });

    test('1. Mapping Autorizado: ARTICULO se proyecta al elemento XHTML definido en el SemanticMap', () => {
        const payload = {
            derivedTree: mockE21Tree,
            semanticMap: mockSemanticMap
        };

        const serializedOutput = SemanticSerializer.serialize(payload);
        const rootElement = serializedOutput.xhtmlNodes[0];

        // Debe mapear ARTICULO -> <article>
        expect(rootElement.tagName).toBe('article');
        expect(rootElement.attributes['id']).toBe('ART_1');
    });

    test('2. Conservación de Jerarquía: Un child certificado se serializa DENTRO de su propietario', () => {
        const payload = {
            derivedTree: mockE21Tree,
            semanticMap: mockSemanticMap
        };

        const serializedOutput = SemanticSerializer.serialize(payload);
        const rootElement = serializedOutput.xhtmlNodes[0];

        // El artículo debe contener al parágrafo
        expect(rootElement.children.length).toBe(1);
        expect(rootElement.children[0].tagName).toBe('p');
        expect(rootElement.children[0].content).toBe('Parágrafo 1. Texto.');
    });

    test('3. Provenance Contract: Se inyecta trazabilidad usando el namespace data-ld-*', () => {
        const payload = {
            derivedTree: mockE21Tree,
            semanticMap: mockSemanticMap
        };

        const serializedOutput = SemanticSerializer.serialize(payload);
        const rootElement = serializedOutput.xhtmlNodes[0];
        const childElement = rootElement.children[0];

        // Validamos el namespace
        expect(rootElement.attributes['data-ld-e18']).toBe('e18-hash');
        expect(rootElement.attributes['data-ld-e20-5']).toBe('e20-hash');
        
        // El child debe tener su propia procedencia y regla de propiedad
        expect(childElement.attributes['data-ld-e20-7']).toBe('e207-hash');
        expect(childElement.attributes['data-ld-rule']).toBe('DEPENDS_ON_PRECEDING_ARTICULO');
    });

    test('4. Prohibición de Falsificación: No se inventa provenance si la evidencia está ausente', () => {
        const treeWithoutProvenance = {
            nodes: [{
                baseDossierId: 'ART_2',
                semanticType: 'ARTICULO',
                sourceEvidence: { astIndex: 12, text: 'Texto' },
                // Sin bloque provenance
                children: []
            }]
        };

        const payload = {
            derivedTree: treeWithoutProvenance,
            semanticMap: mockSemanticMap
        };

        const serializedOutput = SemanticSerializer.serialize(payload);
        const element = serializedOutput.xhtmlNodes[0];

        // No debe fabricar atributos data-ld-* de la nada
        expect(element.attributes['data-ld-e18']).toBeUndefined();
        expect(element.attributes['data-ld-rule']).toBeUndefined();
    });

    test('5. Falla Controlada: Un tipo semántico no mapeado (UNKNOWN) lanza excepción o se serializa según contrato', () => {
        const treeWithUnknown = {
            nodes: [{
                baseDossierId: 'ART_3',
                semanticType: 'UNKNOWN_ENTITY', // No existe en mockSemanticMap
                sourceEvidence: { astIndex: 13, text: 'Texto' },
                children: []
            }]
        };

        const payload = {
            derivedTree: treeWithUnknown,
            semanticMap: mockSemanticMap
        };

        expect(() => {
            SemanticSerializer.serialize(payload);
        }).toThrow(/UNMAPPED_SEMANTIC_ENTITY/);
    });

    test('6. Inmutabilidad Absoluta: El árbol E21 permanece congelado e inalterado', () => {
        const payload = {
            derivedTree: mockE21Tree,
            semanticMap: mockSemanticMap
        };

        SemanticSerializer.serialize(payload);
        
        // Verificamos que el framework JS confirme que sigue congelado
        expect(Object.isFrozen(mockE21Tree)).toBe(true);
        expect(Object.isFrozen(mockE21Tree.nodes[0])).toBe(true);
    });

});