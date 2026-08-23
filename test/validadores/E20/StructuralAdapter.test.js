/**
 * E20.5.2 — Structural Evidence Adapter Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Adaptador de Evidencia Estructural:
 * - Ensambla expedientes estructurales a partir de dossiers E20.3 congelados y validados.
 * - Verifica rigurosamente la cadena completa de procedencia (E18, E19, E20.2, E20.3).
 * - Rechaza inputs inválidos o huérfanos lanzando errores de contrato, separándolos del UNKNOWN epistemológico.
 * - Aplica congelamiento profundo (Deep Freeze) y delega la resolución compositiva al InternalStructureEngine.
 */

'use strict';

// El adaptador estructural aún no está implementado (Fase RED esperada)
const StructuralAdapter = require('../../../src/validadores/E20/StructuralAdapter');

describe('E20.5.2 — Structural Evidence Adapter Contract (Fase RED)', () => {

    const validMockDossier = Object.freeze({
        alignmentId: 1,
        claim: { status: 'VALIDATED', semanticType: 'ARTICULO' },
        traceability: {
            e18EvidenceRef: { status: 'ALIGN.MATCH', astRange: [0, 0] },
            e19EvidenceRef: { editorialEquivalence: 'NOT_DEMONSTRATED' }
        }
    });

    test('1. Dossier E20.3 válido genera expediente estructural con procedencia completa', () => {
        const payload = {
            dossiers: [validMockDossier],
            astNodes: [{ normalizedText: 'Artículo 1. Objeto de la norma.' }],
            evaluationVersion: '1.0.0'
        };

        const report = StructuralAdapter.processCorpus(payload);

        expect(report).toBeDefined();
        expect(report.summary.totalDossiers).toBe(1);
        expect(report.structures).toHaveLength(1);
        expect(report.structures[0].provenance.topology).toBe('E18.4');
        expect(Object.isFrozen(report)).toBe(true);
    });

    test('2. Evidencia de procedencia ausente provoca rechazo contractual explícito', () => {
        const invalidDossier = Object.freeze({
            alignmentId: 2,
            claim: { status: 'VALIDATED' },
            traceability: {} // Sin E18/E19
        });

        const payload = {
            dossiers: [invalidDossier],
            astNodes: [{ normalizedText: 'Texto huérfano.' }],
            evaluationVersion: '1.0.0'
        };

        expect(() => {
            StructuralAdapter.processCorpus(payload);
        }).toThrow(/PROVENANCE_CONTRACT_VIOLATION/);
    });

    test('3. Input nulo o inválido en el adaptador lanza error de contrato', () => {
        expect(() => {
            StructuralAdapter.processCorpus(null);
        }).toThrow(/STRUCTURAL_ADAPTER_VIOLATION/);
    });

    test('4. El adaptador no infiere estructura por proximidad visual; delega en el motor léxico', () => {
        const payload = {
            dossiers: [validMockDossier],
            astNodes: [{ normalizedText: 'Artículo único. Línea sin marcador de párrafo.' }],
            evaluationVersion: '1.0.0'
        };

        const report = StructuralAdapter.processCorpus(payload);
        const structure = report.structures[0];

        expect(structure.composition.type).toBe('ATOMIC_BLOCK');
    });

});