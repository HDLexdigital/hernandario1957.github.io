/**
 * E21.2 — Evidence-to-Tree Adapter Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Adaptador de Reconstitución:
 * - Convierte el reporte de atribución masiva (E20.7) en un Árbol Derivado (DerivedTree).
 * - Garantiza la "conservación de la masa": N artículos de entrada = N nodos derivados en la raíz.
 * - Ejecuta la auditoría de integridad estructural de forma nativa (Invariants Check).
 * - Ninguna mutación al AST original; todo se genera como una estructura paralela (clon inmutable).
 */

'use strict';

// El adaptador de reconstitución aún no está implementado (Fase RED esperada)
const ReconstitutionAdapter = require('../../../src/validadores/E21/ReconstitutionAdapter');

describe('E21.2 — Evidence-to-Tree Adapter Contract (Fase RED)', () => {

    const mockASTNodes = Object.freeze({
        10: { index: 10, normalizedText: 'Artículo 1. Texto.' },
        11: { index: 11, normalizedText: 'Parágrafo certificado.' },
        20: { index: 20, normalizedText: 'Artículo 2. Texto.' },
        21: { index: 21, normalizedText: 'Texto sin atributo.' }
    });

    const mockE20_7_Report = Object.freeze({
        attributions: [
            // Dossier 1: Con un candidato confirmado
            {
                baseObservationRef: { traceability: { e20_5_Ref: { alignmentId: 'ART_1' } } },
                nodeAttributions: [
                    {
                        ownershipStatus: 'OWNERSHIP_CONFIRMED',
                        appliedRule: 'RULE_X',
                        traceability: { astIndex: 11 }
                    }
                ]
            },
            // Dossier 2: Sin candidatos confirmados (solo UNKNOWN)
            {
                baseObservationRef: { traceability: { e20_5_Ref: { alignmentId: 'ART_2' } } },
                nodeAttributions: [
                    {
                        ownershipStatus: 'UNKNOWN',
                        traceability: { astIndex: 21 }
                    }
                ]
            }
        ]
    });

    test('1. Adaptación Masiva: Transforma el reporte E20.7 en una lista de nodos derivados', () => {
        const payload = {
            attributionReport: mockE20_7_Report,
            originalASTNodes: mockASTNodes,
            evaluationVersion: '1.0.0'
        };

        const derivedTree = ReconstitutionAdapter.synthesizeTree(payload);

        expect(derivedTree).toBeDefined();
        // Deben existir 2 nodos raíz derivados correspondientes a los 2 dossiers originales
        expect(derivedTree.nodes.length).toBe(2);
        expect(derivedTree.nodes[0].baseDossierId).toBe('ART_1');
        expect(derivedTree.nodes[1].baseDossierId).toBe('ART_2');
    });

    test('2. Conservación Probatoria: Asigna correctamente los children solo donde hay autorización', () => {
        const payload = {
            attributionReport: mockE20_7_Report,
            originalASTNodes: mockASTNodes,
            evaluationVersion: '1.0.0'
        };

        const derivedTree = ReconstitutionAdapter.synthesizeTree(payload);

        // ART_1 debe tener 1 hijo
        expect(derivedTree.nodes[0].children.length).toBe(1);
        expect(derivedTree.nodes[0].children[0].sourceEvidence.astIndex).toBe(11);
        
        // ART_2 no tiene autorización, sus children deben estar vacíos
        expect(derivedTree.nodes[1].children.length).toBe(0);
    });

    test('3. Auditoría de Integridad Estructural (Conservación de masa y cero orfandad)', () => {
        const payload = {
            attributionReport: mockE20_7_Report,
            originalASTNodes: mockASTNodes,
            evaluationVersion: '1.0.0'
        };

        const derivedTree = ReconstitutionAdapter.synthesizeTree(payload);

        expect(derivedTree.integrityAudit).toBeDefined();
        expect(derivedTree.integrityAudit.inputDossiers).toBe(2);
        expect(derivedTree.integrityAudit.derivedNodes).toBe(2);
        expect(derivedTree.integrityAudit.totalSynthesizedChildren).toBe(1); // Solo 1 parágrafo confirmado
        expect(derivedTree.integrityAudit.orphanInputs).toBe(0);
    });

    test('4. Inmutabilidad: El Árbol Derivado resultante aplica Deep Freeze completo', () => {
        const payload = {
            attributionReport: mockE20_7_Report,
            originalASTNodes: mockASTNodes,
            evaluationVersion: '1.0.0'
        };

        const derivedTree = ReconstitutionAdapter.synthesizeTree(payload);
        
        expect(Object.isFrozen(derivedTree)).toBe(true);
        expect(Object.isFrozen(derivedTree.nodes)).toBe(true);
    });

    test('5. Input inválido o sin reporte de E20.7 lanza excepción de contrato', () => {
        expect(() => {
            ReconstitutionAdapter.synthesizeTree({ attributionReport: null });
        }).toThrow(/RECONSTITUTION_ADAPTER_VIOLATION/);
    });

});