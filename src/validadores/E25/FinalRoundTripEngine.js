/**
 * E25.8 — FinalRoundTripEngine
 * 
 * - Capa probatoria estricta (Observador sin mutación).
 * - Ejecuta Read-back y compara estructural y semánticamente contra el AST canónico (E21).
 * - Valida la trazabilidad de nodeIds, estilos y Export Tags de accesibilidad.
 * - Sella la cadena de procedencia (Provenance) otorgando el estado terminal PRODUCTION_CERTIFIED.
 */

'use strict';

class FinalRoundTripEngine {

    /**
     * Certifica o rechaza un artefacto mediante comparación semántica y estructural profunda.
     */
    static certifyArtifact(artifact, canonicalAst, provenanceContext = { chainValid: true }) {
        
        // RT1: Validación de Read-back físico disponible
        if (!artifact || !artifact.readBackData || !artifact.readBackData.nodes) {
            return { status: 'ROUND_TRIP_FAILED', reason: 'READ_BACK_MISSING' };
        }

        // RT2: Validación de Identidad del Artefacto
        if (artifact.jobIdentity !== canonicalAst.jobIdentity || artifact.executionId !== canonicalAst.executionId) {
            return { status: 'ROUND_TRIP_FAILED', reason: 'ARTIFACT_IDENTITY_MISMATCH' };
        }

        const astNodes = canonicalAst.nodes;
        const readNodes = artifact.readBackData.nodes;

        // RT3 & RT4: Equivalencia estructural (Misma cantidad de nodos)
        if (astNodes.length !== readNodes.length) {
            return { status: 'ROUND_TRIP_FAILED', reason: 'STRUCTURAL_EQUIVALENCE_MISMATCH' };
        }

        for (let i = 0; i < astNodes.length; i++) {
            const astNode = astNodes[i];
            const readNode = readNodes[i];

            // RT5: Continuidad estricta de nodeId (Trazabilidad Editorial)
            if (astNode.nodeId !== readNode.nodeId) {
                return { status: 'ROUND_TRIP_FAILED', reason: 'NODE_ID_MISMATCH' };
            }

            // RT4: Equivalencia semántica de contenido textual
            if (astNode.text !== readNode.text) {
                return { status: 'ROUND_TRIP_FAILED', reason: 'SEMANTIC_ROUND_TRIP_MISMATCH' };
            }

            // RT6: Verificación de Estilos y Export Tags (Accesibilidad WCAG/EPUB3)
            if (astNode.styleId !== readNode.styleId) {
                return { status: 'ROUND_TRIP_FAILED', reason: 'STYLE_ROUND_TRIP_MISMATCH' };
            }
            if (astNode.exportTag !== readNode.exportTag) {
                return { status: 'ROUND_TRIP_FAILED', reason: 'EXPORT_TAG_ROUND_TRIP_MISMATCH' };
            }
        }

        // RT7: Validación de la Cadena de Provenance (E24.4)
        if (!provenanceContext.chainValid) {
            return { status: 'PROVENANCE_FAILED', reason: 'PROVENANCE_CHAIN_BROKEN' };
        }

        // RT8: Certificación Terminal Inmutable (PRODUCTION_CERTIFIED)
        return {
            status: 'PRODUCTION_CERTIFIED',
            artifactId: artifact.artifactId,
            jobIdentity: artifact.jobIdentity,
            executionId: artifact.executionId,
            provenanceFinalized: true,
            terminalState: true,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = FinalRoundTripEngine;