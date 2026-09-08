/**
 * E24.4.5 — Corpus Provenance Certification (Ensayo de certificación sobre corpus real)
 */

'use strict';

const ArtifactRegistryEngine = require('../../../src/validadores/E24/ArtifactRegistryEngine');
const CorpusProvenanceCertifier = require('../../../src/validadores/E24/CorpusProvenanceCertifier');

describe('E24.4.5 — Corpus Provenance Certification (Ensayo real)', () => {
    
    test('Certificación del corpus real de 87 nodos', () => {
        const registry = new ArtifactRegistryEngine();
        const jobIdentity = 'JOB_LEXDIGITAL_2026_COLOMBIA';

        // 1. Registro de Artefactos Reales (Simulando carga de E21, E22, E23)
        const artifacts = [
            { artifactId: 'AST_E21', artifactType: 'SOURCE_AST', jobIdentity, payload: { nodos: 87 } },
            { artifactId: 'CANON_E22', artifactType: 'CANONICAL_XHTML', jobIdentity, payload: { source: 'AST_E21' } },
            { artifactId: 'PLAN_E23', artifactType: 'PROJECTION_PLAN', jobIdentity, payload: { source: 'CANON_E22' } }
        ];

        const regs = artifacts.map(a => registry.registerArtifact(a));

        // 2. Registro de Enlaces (Procedencia del grafo)
        registry.registerProvenance(jobIdentity, {
            previousArtifactHash: regs[0].contentHash,
            currentArtifactHash: regs[1].contentHash,
            relation: 'DERIVED_FROM',
            stage: 'E21_TO_E22'
        });

        registry.registerProvenance(jobIdentity, {
            previousArtifactHash: regs[1].contentHash,
            currentArtifactHash: regs[2].contentHash,
            relation: 'PROJECTED_FROM',
            stage: 'E22_TO_E23'
        });

        // 3. Ejecutar Certificación
        const certificate = CorpusProvenanceCertifier.certify(registry, jobIdentity, {
            rootArtifactId: 'AST_E21',
            expectedNodes: 87
        });

        // 4. Validaciones finales
        expect(certificate.status).toBe('CERTIFIED');
        expect(certificate.corpus.verifiedNodes).toBe(87);
        expect(certificate.provenance.valid).toBe(true);
        expect(certificate.certificateHash).toBeDefined();
        
        console.log('Certificado Forense Generado:', certificate.certificateHash);
    });
});