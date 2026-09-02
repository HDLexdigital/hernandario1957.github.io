/**
 * E20.4.2 — Relation Adapter & Mass Evaluation Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Adaptador de Relaciones:
 * - Transforma los dossiers congelados de E20.3 en entradas limpias para el RelationEngine.
 * - Garantiza que el adaptador no invente relaciones ni viole el principio de no inferencia por proximidad.
 * - Audita la preservación estricta e inmutable de los baselines anteriores (E20.3 / E20.2.4).
 * - Exige la ausencia total de relaciones huérfanas y fallos de trazabilidad.
 */

'use strict';

// El adaptador masivo aún no está implementado (Fase RED esperada)
const RelationAdapter = require('../../../src/validadores/E20/RelationAdapter');

describe('E20.4.2 — Relation Adapter Contract (Fase RED)', () => {

    const mockE20FrozenCorpus = Object.freeze([
        Object.freeze({
            alignmentId: 1,
            claim: { status: 'VALIDATED', semanticType: 'ARTICULO' },
            traceability: { e18EvidenceRef: { astRange: [0, 0] } }
        }),
        Object.freeze({
            alignmentId: 2,
            claim: { status: 'VALIDATED', semanticType: 'ARTICULO' },
            traceability: { e18EvidenceRef: { astRange: [1, 1] } }
        })
    ]);

    test('1. Adaptación masiva procesa el corpus y genera reporte relacional inmutable', () => {
        const report = RelationAdapter.processCorpus({
            dossiers: mockE20FrozenCorpus,
            astNodes: [{ normalizedText: 'Artículo 1. Objeto.' }, { normalizedText: 'Ver artículo 1.' }],
            evaluationVersion: '1.0.0'
        });

        expect(report).toBeDefined();
        expect(report.summary.totalDossiers).toBe(2);
        expect(report.relations).toHaveLength(2);
        expect(Object.isFrozen(report)).toBe(true);
    });

    test('2. Aislamiento estricto: la proximidad espacial sin texto explícito deriva en UNKNOWN', () => {
        const report = RelationAdapter.processCorpus({
            dossiers: mockE20FrozenCorpus,
            astNodes: [{ normalizedText: 'Artículo primero.' }, { normalizedText: 'Artículo segundo contiguo abajo.' }],
            evaluationVersion: '1.0.0'
        });

        const secondRelation = report.relations[1];
        expect(secondRelation.relation.status).toBe('UNKNOWN');
    });

    test('3. Invariantes de seguridad: Cero relaciones huérfanas y cero mutaciones de baseline', () => {
        const report = RelationAdapter.processCorpus({
            dossiers: mockE20FrozenCorpus,
            astNodes: [{ normalizedText: 'Texto a.' }, { normalizedText: 'Texto b.' }],
            evaluationVersion: '1.0.0'
        });

        expect(report.invariantsCheck.orphanRelations).toBe(0);
        expect(report.invariantsCheck.baselineMutations).toBe(0);
        expect(report.invariantsCheck.traceabilityFailures).toBe(0);
    });

});