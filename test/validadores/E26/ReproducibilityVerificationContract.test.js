/**
 * E26.6 — Reproducibility Verification Contract Suite
 * 
 * Fase: GOVERNANCE / IMPLEMENTATION
 * 
 * Contrato de Verificación de Reproducibilidad (E26.6):
 * - RV1. IDENTICAL INPUT IDENTITY: Exige idéntica identidad de entrada (job, ast, plan, source corpus).
 * - RV2. FROZEN CONTRACT SET: Exige correspondencia exacta con las versiones certificadas de E18–E25.
 * - RV3. CANONICAL BUILD CONFIGURATION: Normaliza la configuración de compilación excluyendo ruido efímero.
 * - RV4 & RV5. DETERMINISTIC OUTPUT & HASH EQUALITY: Compara salidas semánticas y artefactos físicos (Bitwise vs Semantic).
 * - RV6. RUNTIME NOISE EXCLUSION: Inmune a variaciones de timestamps, PIDs, hilos o telemetría.
 * - RV7 & RV8. REPRODUCTION CERTIFICATE & TERMINAL VERDICT: Emite un ReproductionCertificate con hash propio y veredicto REPRODUCTION_VERIFIED.
 */

'use strict';

const ReproducibilityVerificationEngine = require('../../../src/validadores/E26/ReproducibilityVerificationEngine');

describe('E26.6 — Reproducibility Verification Contract', () => {

    let originalBuild;
    let rebuildCandidate;
    let buildConfig;

    beforeEach(() => {
        buildConfig = {
            projectionPolicy: 'STANDARD_LEGAL_01',
            styleMapping: 'DEFAULT_MAPPING',
            exportMapping: 'WCAG_EPUB3'
        };

        originalBuild = {
            jobIdentity: 'JOB_RELEASE_999',
            astIdentity: 'AST_HASH_ORIGINAL',
            projectionPlanIdentity: 'PLAN_HASH_ORIGINAL',
            sourceCorpusHash: 'CORPUS_HASH_01',
            contractSetVersion: 'E18-E25.8',
            artifactHashes: {
                INDD: 'HASH_INDD_VAL',
                PDF: 'HASH_PDF_VAL',
                EPUB: 'HASH_EPUB_VAL'
            },
            semanticOutputHash: 'SEMANTIC_HASH_VAL',
            timestamp: '2026-08-22T00:00:00.000Z', // Ruido de runtime
            runtimeTelemetry: { pid: 1234 }        // Ruido de runtime
        };

        rebuildCandidate = {
            jobIdentity: 'JOB_RELEASE_999',
            astIdentity: 'AST_HASH_ORIGINAL',
            projectionPlanIdentity: 'PLAN_HASH_ORIGINAL',
            sourceCorpusHash: 'CORPUS_HASH_01',
            contractSetVersion: 'E18-E25.8',
            artifactHashes: {
                INDD: 'HASH_INDD_VAL',
                PDF: 'HASH_PDF_VAL',
                EPUB: 'HASH_EPUB_VAL'
            },
            semanticOutputHash: 'SEMANTIC_HASH_VAL',
            timestamp: '2026-08-22T14:30:00.000Z', // Timestamp diferente (ruido)
            runtimeTelemetry: { pid: 5678 }        // PID diferente (ruido)
        };
    });

    test('RV1, RV4, RV5, RV6 & RV8. REPRODUCTION VERIFIED: Verifica con éxito un build reconstruido idéntico pese al ruido', () => {
        const certificate = ReproducibilityVerificationEngine.verifyReproducibility(originalBuild, rebuildCandidate, buildConfig);

        expect(certificate.status).toBe('REPRODUCTION_VERIFIED');
        expect(certificate.bitwiseMatch).toBe(true);
        expect(certificate.semanticMatch).toBe(true);
        expect(certificate.reproductionCertificateHash).toBeDefined();
    });

    test('RV1. INPUT IDENTITY MISMATCH: Rechaza si el AST o el corpus de entrada difieren', () => {
        rebuildCandidate.astIdentity = 'AST_HASH_MODIFIED';

        const certificate = ReproducibilityVerificationEngine.verifyReproducibility(originalBuild, rebuildCandidate, buildConfig);

        expect(certificate.status).toBe('REPRODUCTION_FAILED');
        expect(certificate.reason).toBe('REPRODUCTION_INPUT_MISMATCH');
    });

    test('RV2. CONTRACT SET MISMATCH: Rechaza si el conjunto de contratos E18–E25 ha sido alterado', () => {
        rebuildCandidate.contractSetVersion = 'E18-E25.9-MODIFIED';

        const certificate = ReproducibilityVerificationEngine.verifyReproducibility(originalBuild, rebuildCandidate, buildConfig);

        expect(certificate.status).toBe('REPRODUCTION_FAILED');
        expect(certificate.reason).toBe('REPRODUCTION_CONTRACT_MISMATCH');
    });

    test('RV5. BITWISE VS SEMANTIC DISTINCTION: Detecta divergencia física manteniendo traza', () => {
        rebuildCandidate.artifactHashes.PDF = 'HASH_PDF_MODIFIED_BY_METADATA';

        const certificate = ReproducibilityVerificationEngine.verifyReproducibility(originalBuild, rebuildCandidate, buildConfig);

        expect(certificate.status).toBe('REPRODUCTION_FAILED');
        expect(certificate.bitwiseMatch).toBe(false);
        expect(certificate.reason).toBe('ARTEFACT_HASH_DIVERGENCE');
    });
});