/**
 * E21.1 — Reconstitution Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Reconstitución Estructural (Síntesis Derivada):
 * - Transforma un dictamen de OWNERSHIP_CONFIRMED en una relación estructural (parent -> children).
 * - Garantiza inmutabilidad estricta: El AST original y los dossiers E20.x permanecen intactos.
 * - Prohíbe materializar relaciones para dictámenes UNKNOWN o REJECTED_PROXIMITY_INFERENCE.
 * - Exige conservación probatoria: el nodo derivado debe contener `sourceEvidence`, `ownershipEvidence` y `provenance`.
 * - Restringe afirmaciones: rechaza intentos de reconstitución que carezcan de autorización certificada E20.7.
 */

'use strict';

// El motor de reconstitución aún no está implementado (Fase RED esperada)
const ReconstitutionEngine = require('../../../src/validadores/E21/ReconstitutionEngine');

describe('E21.1 — Derived Tree Reconstitution Contract (Fase RED)', () => {

    const mockASTNodeOriginal = Object.freeze({
        index: 11,
        normalizedText: 'Parágrafo. Texto certificado.'
    });

    const mockE20_7_Attribution = Object.freeze({
        ownershipStatus: 'OWNERSHIP_CONFIRMED',
        attributedOwner: { semanticType: 'ARTICULO' },
        appliedRule: 'DEPENDS_ON_PRECEDING_ARTICULO',
        traceability: {
            astIndex: 11,
            e20_6_Ref: { /* Referencia simulada al reporte de fronteras */ }
        }
    });

    const mockE20_7_Unknown = Object.freeze({
        ownershipStatus: 'UNKNOWN',
        traceability: { astIndex: 12 }
    });

    test('1. OWNERSHIP_CONFIRMED genera un nodo derivado (child) con procedencia probatoria intacta', () => {
        const payload = {
            baseDossierId: 'ARTICULO_1',
            attributions: [mockE20_7_Attribution],
            originalASTNodes: { 11: mockASTNodeOriginal }
        };

        const derivedNode = ReconstitutionEngine.synthesizeNode(payload);

        expect(derivedNode.children).toBeDefined();
        expect(derivedNode.children.length).toBe(1);
        
        const child = derivedNode.children[0];
        // Conservación de la evidencia requerida
        expect(child.sourceEvidence.astIndex).toBe(11);
        expect(child.sourceEvidence.text).toBe('Parágrafo. Texto certificado.');
        expect(child.ownershipEvidence.rule).toBe('DEPENDS_ON_PRECEDING_ARTICULO');
        expect(child.provenance.e20_7_Ref).toBeDefined();
    });

    test('2. Inmutabilidad: El proceso genera un clon derivado y no altera la evidencia original', () => {
        const payload = {
            baseDossierId: 'ARTICULO_1',
            attributions: [mockE20_7_Attribution],
            originalASTNodes: { 11: mockASTNodeOriginal }
        };

        const derivedNode = ReconstitutionEngine.synthesizeNode(payload);

        // El objeto original debe permanecer congelado y sin la propiedad 'children'
        expect(Object.isFrozen(mockE20_7_Attribution)).toBe(true);
        expect(Object.isFrozen(mockASTNodeOriginal)).toBe(true);
        expect(mockE20_7_Attribution.children).toBeUndefined();
    });

    test('3. Dictámenes UNKNOWN o REJECTED no generan relaciones estructurales (children)', () => {
        const payload = {
            baseDossierId: 'ARTICULO_2',
            attributions: [mockE20_7_Unknown],
            originalASTNodes: { 12: { index: 12, normalizedText: 'Indefinido' } }
        };

        const derivedNode = ReconstitutionEngine.synthesizeNode(payload);

        // Al no estar autorizado, el array de hijos debe estar vacío o ser indefinido
        expect(derivedNode.children).toEqual([]);
    });

    test('4. Restricción de Afirmaciones: Falla si se intenta reconstituir un nodo sin autorización E20.7', () => {
        const unauthorizedPayload = {
            baseDossierId: 'ARTICULO_3',
            attributions: [ { ownershipStatus: 'OWNERSHIP_INVENTED' } ], // Reclamación no certificada
            originalASTNodes: { 13: { index: 13, normalizedText: 'Falso positivo' } }
        };

        expect(() => {
            ReconstitutionEngine.synthesizeNode(unauthorizedPayload);
        }).toThrow(/UNAUTHORIZED_SYNTHESIS_CLAIM/);
    });

    test('5. El árbol derivado se emite en estado Deep Freeze para convertirse en nuevo baseline', () => {
        const payload = {
            baseDossierId: 'ARTICULO_1',
            attributions: [mockE20_7_Attribution],
            originalASTNodes: { 11: mockASTNodeOriginal }
        };

        const derivedNode = ReconstitutionEngine.synthesizeNode(payload);

        expect(Object.isFrozen(derivedNode)).toBe(true);
        expect(Object.isFrozen(derivedNode.children[0])).toBe(true);
    });

});