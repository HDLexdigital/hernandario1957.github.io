/**
 * E26.7 — Production Corpus Certification Contract Suite
 * 
 * Fase: GOVERNANCE / IMPLEMENTATION
 * 
 * Contrato de Certificación Agregada del Corpus de Producción (E26.7):
 * - PC1 & PC8. CORPUS IDENTITY & IMMUTABLE CERTIFICATE: Genera un corpusCertificationHash determinista inmutable.
 * - PC2 & PC3. COMPLETE COVERAGE & CLOSURE: Exige cobertura total y cierre de la cadena E24–E26 para cada unidad.
 * - PC4. CROSS-ARTIFACT INTEGRITY: Bloquea mezclas de ejecuciones o jobIdentities incompatibles en el corpus.
 * - PC5. MULTI-FORMAT CLOSURE: Eleva la consistencia INDD/PDF/EPUB3 a nivel global de corpus.
 * - PC6 & PC7. PROVENANCE & REPRODUCTION CLOSURE: Exige clausura de procedencia (E24.4/E26.5) y reproducibilidad (E26.6).
 */

'use strict';

const ProductionCorpusCertificationEngine = require('../../../src/validadores/E26/ProductionCorpusCertificationEngine');

describe('E26.7 — Production Corpus Certification Contract', () => {

    let validCorpusMeta;
    let validCorpusUnits;

    beforeEach(() => {
        validCorpusMeta = {
            corpusIdentity: 'CORPUS_CONSTITUCION_Y_CODIGOS',
            corpusVersion: '2026.08',
            jobIdentity: 'JOB_CORPUS_RELEASE_01'
        };

        validCorpusUnits = [
            {
                artifactId: 'ART_CONST_INDD',
                jobIdentity: 'JOB_CORPUS_RELEASE_01',
                certificationRecordStatus: 'PRODUCTION_CERTIFIED',
                manifestStatus: 'CERTIFIED',
                multiFormatStatus: 'MULTI_FORMAT_CERTIFIED',
                provenanceStatus: 'CLOSED',
                reproductionStatus: 'REPRODUCTION_VERIFIED'
            },
            {
                artifactId: 'ART_CIVIL_PDF',
                jobIdentity: 'JOB_CORPUS_RELEASE_01',
                certificationRecordStatus: 'PRODUCTION_CERTIFIED',
                manifestStatus: 'CERTIFIED',
                multiFormatStatus: 'MULTI_FORMAT_CERTIFIED',
                provenanceStatus: 'CLOSED',
                reproductionStatus: 'REPRODUCTION_VERIFIED'
            }
        ];
    });

    test('PC1, PC3, PC5, PC6, PC7 & PC8. CORPUS CERTIFIED: Certifica con éxito un corpus completo, cerrado y reproducible', () => {
        const certificate = ProductionCorpusCertificationEngine.certifyCorpus(validCorpusMeta, validCorpusUnits);

        expect(certificate.status).toBe('PRODUCTION_CORPUS_CERTIFIED');
        expect(certificate.corpusCertificationHash).toBeDefined();
        expect(certificate.totalUnitsCertified).toBe(2);
    });

    test('PC2 & PC3. INCOMPLETE COVERAGE: Rechaza el corpus si falta alguna unidad o su cadena no está cerrada', () => {
        const incompleteUnits = [
            ...validCorpusUnits,
            {
                artifactId: 'ART_PENAL_INCOMPLETE',
                jobIdentity: 'JOB_CORPUS_RELEASE_01',
                certificationRecordStatus: 'DRAFT', // No completado
                manifestStatus: 'PENDING',
                multiFormatStatus: 'REJECTED',
                provenanceStatus: 'OPEN',
                reproductionStatus: 'REPRODUCTION_FAILED'
            }
        ];

        const certificate = ProductionCorpusCertificationEngine.certifyCorpus(validCorpusMeta, incompleteUnits);

        expect(certificate.status).toBe('PRODUCTION_CORPUS_REJECTED');
        expect(certificate.reason).toBe('CORPUS_INCOMPLETE_OR_UNCLOSED');
    });

    test('PC4. CROSS-ARTIFACT IDENTITY CONFLICT: Rechaza si hay unidades con jobIdentity heterogénea o ajena', () => {
        const conflictUnits = [
            ...validCorpusUnits,
            {
                artifactId: 'ART_FOREIGN',
                jobIdentity: 'JOB_DIFFERENT_EXECUTION', // Conflicto de jobIdentity
                certificationRecordStatus: 'PRODUCTION_CERTIFIED',
                manifestStatus: 'CERTIFIED',
                multiFormatStatus: 'MULTI_FORMAT_CERTIFIED',
                provenanceStatus: 'CLOSED',
                reproductionStatus: 'REPRODUCTION_VERIFIED'
            }
        ];

        const certificate = ProductionCorpusCertificationEngine.certifyCorpus(validCorpusMeta, conflictUnits);

        expect(certificate.status).toBe('PRODUCTION_CORPUS_REJECTED');
        expect(certificate.reason).toBe('CORPUS_IDENTITY_CONFLICT');
    });

    test('PC7. REPRODUCTION CLOSURE: Rechaza el corpus si una unidad carece de verificación de reproducibilidad E26.6', () => {
        const unverifiedUnits = [
            {
                ...validCorpusUnits[0],
                reproductionStatus: 'NOT_VERIFIED' // Rompe la clausura de reproducibilidad
            }
        ];

        const certificate = ProductionCorpusCertificationEngine.certifyCorpus(validCorpusMeta, unverifiedUnits);

        expect(certificate.status).toBe('PRODUCTION_CORPUS_REJECTED');
        expect(certificate.reason).toBe('CORPUS_REPRODUCTION_CLOSURE_FAILED');
    });
});