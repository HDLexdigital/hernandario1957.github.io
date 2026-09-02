/**
 * E20.7.2 — Attribution Adapter Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Adaptador de Atribución Estructural:
 * - Consume el reporte transfronterizo de E20.6 (CrossBoundaryAudit).
 * - Inyecta dinámicamente el diccionario de reglas de dominio (domainRules) sin asumir verdades universales.
 * - Delega la evaluación de cada nodo exclusivamente en el OwnershipEngine certificado.
 * - Consolida un reporte global distinguiendo: OWNERSHIP_CONFIRMED, UNKNOWN, REJECTED_PROXIMITY_INFERENCE.
 * - Conserva como evidencia histórica los rechazos de E20.6.
 * - Garantiza cero mutaciones sobre el baseline E20.6.
 */

'use strict';

// El adaptador de atribución aún no está implementado (Fase RED esperada)
const AttributionAdapter = require('../../../src/validadores/E20/AttributionAdapter');

describe('E20.7.2 — Attribution Adapter Contract (Fase RED)', () => {

    const mockE20_6_Report = Object.freeze({
        observations: [
            Object.freeze({
                traceability: { e20_5_Ref: { alignmentId: 1, claim: { semanticType: 'ARTICULO' } } },
                boundaryObservation: {
                    nodesAnalysis: [
                        { astIndex: 20, claim: 'CANDIDATE_STRUCTURE', markerType: 'PARRAFO', structuralLink: 'CANDIDATE_LINK', ownership: 'UNKNOWN' },
                        { astIndex: 21, claim: 'CANDIDATE_STRUCTURE', markerType: 'INDEFINIDO', structuralLink: 'CANDIDATE_LINK', ownership: 'UNKNOWN' },
                        { astIndex: 22, claim: 'UNKNOWN', structuralLink: 'REJECTED_PROXIMITY_INFERENCE', ownership: 'UNKNOWN' }
                    ]
                }
            })
        ]
    });

    const explicitDomainRules = {
        'PARRAFO': 'DEPENDS_ON_PRECEDING_ARTICULO'
    };

    test('1. Adaptación masiva: inyecta reglas explícitas, delega al motor y consolida el reporte', () => {
        const payload = {
            crossBoundaryReport: mockE20_6_Report,
            domainRules: explicitDomainRules,
            evaluationVersion: '1.0.0'
        };

        const auditReport = AttributionAdapter.processAttributions(payload);

        expect(auditReport).toBeDefined();
        expect(auditReport.summary.totalObservations).toBe(1);
        expect(auditReport.summary.ownershipConfirmed).toBe(1); // El nodo 20 (PARRAFO)
        expect(Object.isFrozen(auditReport)).toBe(true);
    });

    test('2. Conservación estricta de la evidencia negativa (REJECTED_PROXIMITY_INFERENCE)', () => {
        const payload = {
            crossBoundaryReport: mockE20_6_Report,
            domainRules: explicitDomainRules,
            evaluationVersion: '1.0.0'
        };

        const auditReport = AttributionAdapter.processAttributions(payload);
        
        // El nodo 22 debe mantenerse intacto en la contabilidad global
        expect(auditReport.summary.rejectedProximityInferences).toBeGreaterThanOrEqual(1);
    });

    test('3. Candidato sin regla de dominio inyectada se clasifica globalmente como UNKNOWN', () => {
        const payload = {
            crossBoundaryReport: mockE20_6_Report,
            domainRules: explicitDomainRules,
            evaluationVersion: '1.0.0'
        };

        const auditReport = AttributionAdapter.processAttributions(payload);
        
        // El nodo 21 (INDEFINIDO) no tiene regla, debe sumar a UNKNOWN
        expect(auditReport.summary.unknownCount).toBeGreaterThanOrEqual(1);
    });

    test('4. Invariantes de Seguridad: Manejo estricto de procedencia y protección de baselines', () => {
        const payload = {
            crossBoundaryReport: mockE20_6_Report,
            domainRules: explicitDomainRules,
            evaluationVersion: '1.0.0'
        };

        const auditReport = AttributionAdapter.processAttributions(payload);

        expect(auditReport.invariantsCheck.orphanInputs).toBe(0);
        expect(auditReport.invariantsCheck.baselineMutations).toBe(0);
        expect(auditReport.invariantsCheck.provenanceFailures).toBe(0);
    });

    test('5. Input nulo, inválido o sin reporte de E20.6 lanza excepción contractual', () => {
        expect(() => {
            AttributionAdapter.processAttributions({
                crossBoundaryReport: null,
                domainRules: explicitDomainRules
            });
        }).toThrow(/ATTRIBUTION_ADAPTER_VIOLATION/);
    });

});