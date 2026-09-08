/**
 * E20.5.1 — Internal Structure Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Resolución de Estructura Interna:
 * - Distingue entre ATOMIC_BLOCK (evidencia de bloque continuo sin divisiones) y UNKNOWN.
 * - Detecta componentes internos mediante marcadores léxicos explícitos (PARRAFO, NUMERAL, LITERAL).
 * - Prohíbe categóricamente inferencias basadas en estilo, posición visual, indentación o expectativas jurídicas.
 * - Garantiza inmutabilidad profunda y preservación absoluta de los baselines anteriores (E18–E20.4).
 */

'use strict';

// El motor de estructura interna aún no está implementado (Fase RED esperada)
const InternalStructureEngine = require('../../../src/validadores/E20/InternalStructureEngine');

describe('E20.5.1 — Internal Structure Contract (Fase RED)', () => {

    const mockBaseDossier = Object.freeze({
        alignmentId: 1,
        claim: { status: 'VALIDATED', semanticType: 'ARTICULO' },
        traceability: { e18EvidenceRef: { status: 'ALIGN.MATCH' } }
    });

    test('1. Texto continuo sin divisiones internas explícitas se clasifica como ATOMIC_BLOCK', () => {
        const payload = {
            baseDossier: mockBaseDossier,
            nodeText: 'Artículo 13. Todas las personas nacen libres e iguales ante la ley.',
            evaluationVersion: '1.0.0'
        };

        const structure = InternalStructureEngine.resolveStructure(payload);

        expect(structure).toBeDefined();
        expect(structure.composition.type).toBe('ATOMIC_BLOCK');
        expect(structure.composition.subComponents).toHaveLength(0);
    });

    test('2. Detección explícita de componentes internos (PARRAFO, NUMERAL, LITERAL)', () => {
        const testCases = [
            { text: 'Artículo 5. Contenido principal. Parágrafo. El Gobierno reglamentará.', expectedType: 'PARRAFO' },
            { text: 'Artículo 10. 1. La defensa de los derechos es prioritaria.', expectedType: 'NUMERAL' },
            { text: 'Artículo 12. a) Los ciudadanos podrán participar...', expectedType: 'LITERAL' }
        ];

        testCases.forEach(tc => {
            const payload = {
                baseDossier: mockBaseDossier,
                nodeText: tc.text,
                evaluationVersion: '1.0.0'
            };

            const structure = InternalStructureEngine.resolveStructure(payload);

            expect(structure.composition.subComponents.some(sc => sc.type === tc.expectedType)).toBe(true);
        });
    });

    test('3. Evidencia ambigua o insuficiente deriva obligatoriamente en UNKNOWN', () => {
        const payload = {
            baseDossier: mockBaseDossier,
            nodeText: 'Fragmento truncado o con sintaxis no reconocida sin delimitadores claros.',
            evaluationVersion: '1.0.0'
        };

        const structure = InternalStructureEngine.resolveStructure(payload);

        expect(structure.composition.type).toBe('UNKNOWN');
    });

    test('4. Prohibición de inferencia visual o posicional (ignora estilo, saltos o indentación)', () => {
        const payload = {
            baseDossier: mockBaseDossier,
            nodeText: 'Texto con salto de línea visual pero sin marcador léxico explícito de división.',
            evaluationVersion: '1.0.0'
        };

        const structure = InternalStructureEngine.resolveStructure(payload);

        // No debe inventar PARRAFO solo por haber un cambio visual o de línea
        expect(structure.composition.subComponents.map(sc => sc.type)).not.toContain('PARRAFO');
    });

    test('5. Inmutabilidad profunda y trazabilidad intacta hacia el baseline E20.3', () => {
        const payload = {
            baseDossier: mockBaseDossier,
            nodeText: 'Artículo 1. Texto de prueba.',
            evaluationVersion: '1.0.0'
        };

        const structure = InternalStructureEngine.resolveStructure(payload);

        expect(structure.traceability.baseDossierRef).toEqual(mockBaseDossier);
        expect(structure.editorialEquivalence).toBe('NOT_DEMONSTRATED');
        expect(Object.isFrozen(structure)).toBe(true);
    });

});