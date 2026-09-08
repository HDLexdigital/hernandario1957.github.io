/**
 * E25.8 — Final Round-Trip & Provenance Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Certificación Probatoria y Read-Back (E25.8):
 * - RT1. READ-BACK OBLIGATORIO: Nunca confía en el éxito ciego de E25.7; exige lectura física posterior.
 * - RT2. ARTIFACT IDENTITY: Valida que jobIdentity, executionId y contentHash coincidan con E24.4.
 * - RT3. STRUCTURAL EQUIVALENCE: La estructura recuperada emula el árbol canónico de E21.
 * - RT4. SEMANTIC EQUIVALENCE: Verifica el contenido textual sin tolerar pérdida, alteración o duplicación.
 * - RT5. NODE ID TRACEABILITY: Cada nodo físico conserva su enlace al nodeId semántico original.
 * - RT6. STYLE / EXPORT TAG RT: Verifica que paragraphStyles, characterStyles y exportTags coincidan con E25.5.
 * - RT7. PROVENANCE FINALIZATION: Cierra el eslabón final de la cadena mediante E24.4 sin duplicar hashes.
 * - RT8. TERMINAL CERTIFICATION: Un round-trip exitoso otorga PRODUCTION_CERTIFIED; cualquier fallo activa E24.3.
 */

'use strict';

const FinalRoundTripEngine = require('../../../src/validadores/E25/FinalRoundTripEngine');

describe('E25.8 — Final Round-Trip & Provenance Contract', () => {

    let canonicalAst;
    let committedArtifact;

    beforeEach(() => {
        canonicalAst = {
            jobIdentity: 'JOB_LEX_COLOMBIA',
            executionId: 'EXEC_001',
            nodes: [
                { nodeId: 'N1', text: 'ARTICULO 1.', styleId: 'Titulo_Articulo', exportTag: 'h1' },
                { nodeId: 'N2', text: 'Colombia es un Estado social de derecho.', styleId: 'Texto_Cuerpo', exportTag: 'p' }
            ]
        };

        committedArtifact = {
            artifactId: 'ARTIFACT_INDD_001',
            jobIdentity: 'JOB_LEX_COLOMBIA',
            executionId: 'EXEC_001',
            contentHash: 'SHA256_MOCK_VALID',
            readBackData: {
                nodes: [
                    { nodeId: 'N1', text: 'ARTICULO 1.', styleId: 'Titulo_Articulo', exportTag: 'h1' },
                    { nodeId: 'N2', text: 'Colombia es un Estado social de derecho.', styleId: 'Texto_Cuerpo', exportTag: 'p' }
                ]
            }
        };
    });

    test('RT1 & RT2. READ-BACK & IDENTITY: Exige lectura física y valida la identidad del artefacto', () => {
        const result = FinalRoundTripEngine.certifyArtifact(committedArtifact, canonicalAst);
        
        expect(result.status).toBe('PRODUCTION_CERTIFIED');
        expect(result.artifactId).toBe('ARTIFACT_INDD_001');
    });

    test('RT3, RT4 & RT5. EQUIVALENCIA Y TRACEABILIDAD DE NODOS: Detecta divergencias semánticas o de nodeId', () => {
        // Alteramos maliciosamente el nodeId en la lectura física (Read-back)
        committedArtifact.readBackData.nodes[0].nodeId = 'NODE_HACKED_OR_CORRUPT';

        const result = FinalRoundTripEngine.certifyArtifact(committedArtifact, canonicalAst);

        expect(result.status).toBe('ROUND_TRIP_FAILED');
        expect(result.reason).toBe('NODE_ID_MISMATCH');
    });

    test('RT6. STYLE & EXPORT TAG RT: Valida que el estilo y la etiqueta semántica sobrevivieron intactos', () => {
        // Alteramos el Export Tag físico en el Read-back (rompiendo accesibilidad WCAG/EPUB3)
        committedArtifact.readBackData.nodes[1].exportTag = 'div'; // Inválido respecto a 'p'

        const result = FinalRoundTripEngine.certifyArtifact(committedArtifact, canonicalAst);

        expect(result.status).toBe('ROUND_TRIP_FAILED');
        expect(result.reason).toBe('EXPORT_TAG_ROUND_TRIP_MISMATCH');
    });

    test('RT7 & RT8. GOLDEN TEST (PROVENANCE & TERMINAL CERTIFICATION): El ciclo completo otorga PRODUCTION_CERTIFIED', () => {
        const provenanceChain = { chainValid: true, lastHash: 'HASH_E24_VALID' };
        
        const result = FinalRoundTripEngine.certifyArtifact(committedArtifact, canonicalAst, provenanceChain);

        expect(result.status).toBe('PRODUCTION_CERTIFIED');
        expect(result.provenanceFinalized).toBe(true);
        expect(result.terminalState).toBe(true);
    });
});