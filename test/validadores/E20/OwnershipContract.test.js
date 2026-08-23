/**
 * E20.7.1 — Ownership Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Atribución Estructural:
 * - Define las condiciones exactas bajo las cuales una CANDIDATE_STRUCTURE (E20.6)
 *   puede convertirse en OWNERSHIP_CONFIRMED.
 * - Exige una regla de dominio explícita para certificar dependencia jerárquica.
 * - Prohíbe categóricamente atribuir propiedad basándose en proximidad, orden o precedencia.
 * - REJECTED_PROXIMITY_INFERENCE se preserva como evidencia negativa inmutable.
 * - Protege los baselines de E20.5 y E20.6 sin alteraciones.
 */

'use strict';

// El motor de atribución aún no está implementado (Fase RED esperada)
const OwnershipEngine = require('../../../src/validadores/E20/OwnershipEngine');

describe('E20.7.1 — Structural Attribution & Ownership Contract (Fase RED)', () => {

    const mockE20_6_BoundaryReport = Object.freeze({
        traceability: { e20_5_Ref: { alignmentId: 1, claim: { semanticType: 'ARTICULO' } } },
        boundaryObservation: {
            nodesAnalysis: [
                {
                    astIndex: 11,
                    claim: 'CANDIDATE_STRUCTURE',
                    structuralLink: 'CANDIDATE_LINK',
                    ownership: 'UNKNOWN',
                    markerType: 'PARRAFO', // Evidencia extraída en E20.6
                    traceability: { baseRange: [10, 10] }
                },
                {
                    astIndex: 12,
                    claim: 'CANDIDATE_STRUCTURE',
                    structuralLink: 'CANDIDATE_LINK',
                    ownership: 'UNKNOWN',
                    markerType: 'UNKNOWN_DEPENDENCY',
                    traceability: { baseRange: [10, 10] }
                },
                {
                    astIndex: 13,
                    claim: 'UNKNOWN',
                    structuralLink: 'REJECTED_PROXIMITY_INFERENCE',
                    ownership: 'UNKNOWN',
                    traceability: { baseRange: [10, 10] }
                }
            ]
        }
    });

    const explicitDomainRules = {
        'PARRAFO': 'DEPENDS_ON_PRECEDING_ARTICULO' // Regla jurídica inyectada explícitamente
    };

    test('1. Candidato con marcador explícito y regla de dominio demostrable -> OWNERSHIP_CONFIRMED', () => {
        const payload = {
            boundaryReport: mockE20_6_BoundaryReport,
            candidateIndex: 11,
            domainRules: explicitDomainRules,
            evaluationVersion: '1.0.0'
        };

        const attribution = OwnershipEngine.evaluateOwnership(payload);

        expect(attribution.ownershipStatus).toBe('OWNERSHIP_CONFIRMED');
        expect(attribution.attributedOwner.semanticType).toBe('ARTICULO');
        expect(attribution.appliedRule).toBe('DEPENDS_ON_PRECEDING_ARTICULO');
    });

    test('2. Candidato sin regla de dependencia demostrable -> UNKNOWN', () => {
        const payload = {
            boundaryReport: mockE20_6_BoundaryReport,
            candidateIndex: 12, // Tiene CANDIDATE_STRUCTURE pero su tipo no tiene regla jurídica
            domainRules: explicitDomainRules,
            evaluationVersion: '1.0.0'
        };

        const attribution = OwnershipEngine.evaluateOwnership(payload);

        // Sin regla explícita que autorice el salto, la proximidad no basta
        expect(attribution.ownershipStatus).toBe('UNKNOWN');
    });

    test('3. REJECTED_PROXIMITY_INFERENCE no puede convertirse en ownership', () => {
        const payload = {
            boundaryReport: mockE20_6_BoundaryReport,
            candidateIndex: 13,
            domainRules: explicitDomainRules,
            evaluationVersion: '1.0.0'
        };

        const attribution = OwnershipEngine.evaluateOwnership(payload);

        expect(attribution.ownershipStatus).toBe('REJECTED_PROXIMITY_INFERENCE');
        expect(attribution.attributedOwner).toBeNull();
    });

    test('4. Atribución huérfana (sin dossier propietario de E20.5) lanza excepción', () => {
        const orphanedReport = {
            boundaryObservation: mockE20_6_BoundaryReport.boundaryObservation
            // Sin traceability hacia E20.5
        };

        expect(() => {
            OwnershipEngine.evaluateOwnership({
                boundaryReport: orphanedReport,
                candidateIndex: 11,
                domainRules: explicitDomainRules
            });
        }).toThrow(/OWNERSHIP_CONTRACT_VIOLATION/);
    });

    test('5. Trazabilidad completa E18->E20.7 e inmutabilidad estricta', () => {
        const payload = {
            boundaryReport: mockE20_6_BoundaryReport,
            candidateIndex: 11,
            domainRules: explicitDomainRules,
            evaluationVersion: '1.0.0'
        };

        const attribution = OwnershipEngine.evaluateOwnership(payload);

        expect(attribution.traceability.e20_6_Ref).toBeDefined();
        expect(attribution.traceability.astIndex).toBe(11);
        expect(Object.isFrozen(attribution)).toBe(true);
    });

});