/**
 * E26.3 — Multi-Format Certification Contract Suite
 * 
 * Fase: GOVERNANCE / IMPLEMENTATION
 * 
 * Contrato de Consistencia Cruzada Multi-Formato (INDD / PDF / EPUB3):
 * - MF1 & MF2. SINGLE ORIGIN & MANIFEST BINDING: Vincula todos los formatos al mismo astIdentity y al Manifest E26.2.
 * - MF3. NODE COVERAGE: Detecta de inmediato cualquier nodo ausente en alguno de los formatos.
 * - MF4 & MF5. SEMANTIC & ACCESSIBILITY EQUIVALENCE: Compara payloads, roles y accesibilidad sin confundir representaciones físicas.
 * - MF6. DETERMINISTIC HASH: Genera un multiFormatCertificationHash canónico inmune a telemetría o timestamps.
 * - MF7 & MF8. COMPLETENESS & NO SILENT NORMALIZATION: Exige el set completo de formatos y rechaza mutaciones automáticas de discrepancias.
 */

'use strict';

const MultiFormatCertificationEngine = require('../../../src/validadores/E26/MultiFormatCertificationEngine');

describe('E26.3 — Multi-Format Certification Contract', () => {

    let validManifest;
    let validFormatPayloads;

    beforeEach(() => {
        validManifest = {
            status: 'CERTIFIED',
            manifestHash: 'MANIFEST_HASH_ABC',
            artifacts: [
                { artifactId: 'ART_INDD', artifactType: 'INDD', jobIdentity: 'JOB_01' },
                { artifactId: 'ART_PDF', artifactType: 'PDF', jobIdentity: 'JOB_01' },
                { artifactId: 'ART_EPUB', artifactType: 'EPUB', jobIdentity: 'JOB_01' }
            ]
        };

        validFormatPayloads = {
            astIdentity: 'AST_HASH_CANONICAL_01',
            projectionPlanIdentity: 'PLAN_HASH_01',
            formats: {
                INDD: {
                    nodes: [
                        { nodeId: 'N1', text: 'Artículo 1.', role: 'HEADING', exportTag: 'h1' },
                        { nodeId: 'N2', text: 'Texto legal.', role: 'PARAGRAPH', exportTag: 'p' }
                    ]
                },
                PDF: {
                    nodes: [
                        { nodeId: 'N1', text: 'Artículo 1.', role: 'HEADING', exportTag: 'h1' },
                        { nodeId: 'N2', text: 'Texto legal.', role: 'PARAGRAPH', exportTag: 'p' }
                    ]
                },
                EPUB: {
                    nodes: [
                        { nodeId: 'N1', text: 'Artículo 1.', role: 'HEADING', exportTag: 'h1' },
                        { nodeId: 'N2', text: 'Texto legal.', role: 'PARAGRAPH', exportTag: 'p' }
                    ]
                }
            }
        };
    });

    test('MF1, MF4, MF5 & MF7. COMPLETE & EQUIVALENT: Certifica exitosamente un set coherente de 3 formatos', () => {
        const result = MultiFormatCertificationEngine.certifyFormats(validManifest, validFormatPayloads);

        expect(result.status).toBe('MULTI_FORMAT_CERTIFIED');
        expect(result.multiFormatCertificationHash).toBeDefined();
        expect(result.certifiedFormats).toContain('INDD');
        expect(result.certifiedFormats).toContain('PDF');
        expect(result.certifiedFormats).toContain('EPUB');
    });

    test('MF3. NODE COVERAGE MISSING: Detecta nodos ausentes en algún formato y rechaza', () => {
        // Removemos el nodo N2 del PDF para romper la cobertura
        validFormatPayloads.formats.PDF.nodes.pop();

        const result = MultiFormatCertificationEngine.certifyFormats(validManifest, validFormatPayloads);

        expect(result.status).toBe('MULTI_FORMAT_REJECTED');
        expect(result.reason).toBe('SEMANTIC_NODE_MISSING');
    });

    test('MF4 & MF5. SEMANTIC & ACCESSIBILITY DIVERGENCE: Detecta divergencias de texto o roles semánticos', () => {
        // Alteramos el texto en el EPUB
        validFormatPayloads.formats.EPUB.nodes[1].text = 'Texto alterado';

        const result = MultiFormatCertificationEngine.certifyFormats(validManifest, validFormatPayloads);

        expect(result.status).toBe('MULTI_FORMAT_REJECTED');
        expect(result.reason).toBe('SEMANTIC_PAYLOAD_MISMATCH');
    });

    test('MF7. COMPLETENESS REQUIRED: Rechaza si falta uno de los formatos obligatorios del manifiesto', () => {
        // Eliminamos EPUB de los payloads evaluados
        delete validFormatPayloads.formats.EPUB;

        const result = MultiFormatCertificationEngine.certifyFormats(validManifest, validFormatPayloads);

        expect(result.status).toBe('MULTI_FORMAT_REJECTED');
        expect(result.reason).toBe('INCOMPLETE_FORMAT_SET');
    });

    test('MF6. DETERMINISTIC HASH & RUNTIME EXCLUSION: El hash es inmune a timestamps y telemetría', () => {
        const payloadA = { ...validFormatPayloads, timestamp: '2026-08-22T00:00:00.000Z' };
        const payloadB = { ...validFormatPayloads, timestamp: '2026-08-22T18:00:00.000Z' };

        const resA = MultiFormatCertificationEngine.certifyFormats(validManifest, payloadA);
        const resB = MultiFormatCertificationEngine.certifyFormats(validManifest, payloadB);

        expect(resA.multiFormatCertificationHash).toBe(resB.multiFormatCertificationHash);
    });
});