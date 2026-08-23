/**
 * E26.6 — ReproducibilityVerificationEngine
 * 
 * - Verifica la reproducibilidad determinista de los builds comparando contra el artefacto original certificado.
 * - Aisla rigurosamente el ruido del runtime (timestamps, PIDs, telemetría) y valida identidades de entrada y contratos.
 * - Distingue entre coincidencia binaria (Bitwise) y semántica, emitiendo un ReproductionCertificate canónico.
 */

'use strict';

const crypto = require('crypto');

class ReproducibilityVerificationEngine {

    /**
     * Verifica si una reconstrucción del build alcanza el estado REPRODUCTION_VERIFIED.
     */
    static verifyReproducibility(originalBuild, rebuildCandidate, buildConfiguration) {
        // RV1: Verificación estricta de Identidad de Entrada
        if (!originalBuild || !rebuildCandidate ||
            originalBuild.jobIdentity !== rebuildCandidate.jobIdentity ||
            originalBuild.astIdentity !== rebuildCandidate.astIdentity ||
            originalBuild.projectionPlanIdentity !== rebuildCandidate.projectionPlanIdentity ||
            originalBuild.sourceCorpusHash !== rebuildCandidate.sourceCorpusHash) {
            return { status: 'REPRODUCTION_FAILED', reason: 'REPRODUCTION_INPUT_MISMATCH', timestamp: new Date().toISOString() };
        }

        // RV2: Verificación de Integridad del Conjunto de Contratos (E18–E25)
        if (originalBuild.contractSetVersion !== rebuildCandidate.contractSetVersion) {
            return { status: 'REPRODUCTION_FAILED', reason: 'REPRODUCTION_CONTRACT_MISMATCH', timestamp: new Date().toISOString() };
        }

        // RV4: Coincidencia Semántica Canónica
        const semanticMatch = originalBuild.semanticOutputHash === rebuildCandidate.semanticOutputHash;
        if (!semanticMatch) {
            return { status: 'REPRODUCTION_FAILED', reason: 'SEMANTIC_OUTPUT_DIVERGENCE', timestamp: new Date().toISOString() };
        }

     // ... (código previo del motor)

        // RV5: Coincidencia Binaria (Bitwise)
        const origArtifacts = originalBuild.artifactHashes || {};
        const rebArtifacts = rebuildCandidate.artifactHashes || {};
        let bitwiseMatch = true;

        const allKeys = new Set([...Object.keys(origArtifacts), ...Object.keys(rebArtifacts)]);
        for (const key of allKeys) {
            if (origArtifacts[key] !== rebArtifacts[key]) {
                bitwiseMatch = false;
                break;
            }
        }

        if (!bitwiseMatch) {
            // CORRECCIÓN: Retornar el objeto incluyendo bitwiseMatch: false
            return Object.freeze({ 
                status: 'REPRODUCTION_FAILED', 
                reason: 'ARTEFACT_HASH_DIVERGENCE', 
                bitwiseMatch: false, 
                semanticMatch: semanticMatch, 
                timestamp: new Date().toISOString() 
            });
        }
// ... (resto del código)

        // RV3 & RV6: Normalización de Configuración Canónica (Excluyendo Ruido de Runtime)
        const canonicalConfig = {
            projectionPolicy: buildConfiguration.projectionPolicy,
            styleMapping: buildConfiguration.styleMapping,
            exportMapping: buildConfiguration.exportMapping
        };

        const canonicalPayload = {
            jobIdentity: originalBuild.jobIdentity,
            astIdentity: originalBuild.astIdentity,
            projectionPlanIdentity: originalBuild.projectionPlanIdentity,
            sourceCorpusHash: originalBuild.sourceCorpusHash,
            contractSetVersion: originalBuild.contractSetVersion,
            semanticOutputHash: originalBuild.semanticOutputHash,
            artifactHashes: origArtifacts,
            buildConfiguration: canonicalConfig
        };

        const canonicalString = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
        const reproductionCertificateHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

        // RV7 & RV8: Emisión de Certificado de Reproducción con Veredicto Terminal Inmutable
        return Object.freeze({
            status: 'REPRODUCTION_VERIFIED',
            jobIdentity: originalBuild.jobIdentity,
            originalArtifactHashes: origArtifacts,
            rebuildArtifactHashes: rebArtifacts,
            bitwiseMatch: bitwiseMatch,
            semanticMatch: semanticMatch,
            reproductionCertificateHash: reproductionCertificateHash,
            issuedAt: new Date().toISOString()
        });
    }
}

module.exports = ReproducibilityVerificationEngine;