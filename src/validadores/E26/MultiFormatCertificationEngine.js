/**
 * E26.3 — MultiFormatCertificationEngine
 * 
 * - Valida la equivalencia semántica cruzada entre los formatos declarados en el Manifiesto (INDD, PDF, EPUB3).
 * - Exige cobertura total de nodeIds, roles, textos y accesibilidad (export tags) sin normalización silenciosa.
 * - Calcula un multiFormatCertificationHash canónico determinista y emite estado terminal.
 */

'use strict';

const crypto = require('crypto');

class MultiFormatCertificationEngine {

    /**
     * Certifica la consistencia multi-formato basándose en la verdad semántica del origen común.
     */
    static certifyFormats(manifest, formatDataset) {
        // MF2: Validación obligatoria de vinculación con el Manifest E26.2
        if (!manifest || manifest.status !== 'CERTIFIED' || !Array.isArray(manifest.artifacts)) {
            return { status: 'MULTI_FORMAT_REJECTED', reason: 'INVALID_OR_MISSING_MANIFEST' };
        }

        if (!formatDataset || !formatDataset.formats || !formatDataset.astIdentity) {
            return { status: 'MULTI_FORMAT_REJECTED', reason: 'INVALID_FORMAT_DATASET' };
        }

        const requiredTypes = ['INDD', 'PDF', 'EPUB'];
        const providedFormats = Object.keys(formatDataset.formats);

        // MF7: Completeness (Todos los formatos del corpus deben estar presentes)
        for (const reqType of requiredTypes) {
            const existsInManifest = manifest.artifacts.some(a => a.artifactType === reqType);
            const existsInDataset = providedFormats.includes(reqType);
            if (!existsInManifest || !existsInDataset) {
                return { status: 'MULTI_FORMAT_REJECTED', reason: 'INCOMPLETE_FORMAT_SET' };
            }
        }

        // Tomamos INDD como base de referencia semántica canónica validada
        const referenceNodes = formatDataset.formats['INDD'].nodes;
        if (!Array.isArray(referenceNodes)) {
            return { status: 'MULTI_FORMAT_REJECTED', reason: 'INVALID_REFERENCE_NODES' };
        }

        // MF3, MF4 & MF5: Auditoría cruzada estricta nodo por nodo contra PDF y EPUB
        for (const formatName of ['PDF', 'EPUB']) {
            const formatNodes = formatDataset.formats[formatName].nodes;

            if (!Array.isArray(formatNodes) || formatNodes.length !== referenceNodes.length) {
                return { status: 'MULTI_FORMAT_REJECTED', reason: 'SEMANTIC_NODE_MISSING' };
            }

            for (let i = 0; i < referenceNodes.length; i++) {
                const refNode = referenceNodes[i];
                const targetNode = formatNodes[i];

                // MF3: Trazabilidad estricta de nodeId
                if (refNode.nodeId !== targetNode.nodeId) {
                    return { status: 'MULTI_FORMAT_REJECTED', reason: 'NODE_ID_MISMATCH' };
                }

                // MF4: Equivalencia de Payload Semántico (Texto y Rol)
                if (refNode.text !== targetNode.text || refNode.role !== targetNode.role) {
                    return { status: 'MULTI_FORMAT_REJECTED', reason: 'SEMANTIC_PAYLOAD_MISMATCH' };
                }

                // MF5: Coherencia de Accesibilidad (Export Tags)
                if (refNode.exportTag !== targetNode.exportTag) {
                    return { status: 'MULTI_FORMAT_REJECTED', reason: 'ACCESSIBILITY_DIVERGENCE' };
                }
            }
        }

        // MF6: Cálculo de Hash Canónico Multi-Formato (Aislado de timestamps o telemetría)
        const canonicalPayload = {
            astIdentity: formatDataset.astIdentity,
            projectionPlanIdentity: formatDataset.projectionPlanIdentity,
            manifestHash: manifest.manifestHash,
            nodeCount: referenceNodes.length
        };

        const canonicalString = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
        const multiFormatCertificationHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

        // Estado terminal de certificación multi-formato
        return Object.freeze({
            status: 'MULTI_FORMAT_CERTIFIED',
            astIdentity: formatDataset.astIdentity,
            manifestHash: manifest.manifestHash,
            multiFormatCertificationHash: multiFormatCertificationHash,
            certifiedFormats: requiredTypes,
            issuedAt: new Date().toISOString()
        });
    }
}

module.exports = MultiFormatCertificationEngine;