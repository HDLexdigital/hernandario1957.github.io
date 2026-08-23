/**
 * E26.7 — ProductionCorpusCertificationEngine
 * 
 * - Certifica de forma agregada el corpus jurídico completo de LexDigitalHD.
 * - Valida la clausura estricta de cadenas (E24–E26), la consistencia transversal de jobIdentities,
 *   la clausura de procedencia y la reproducibilidad obligatoria (E26.6) de cada artefacto.
 * - Emite el ProductionCorpusCertificate terminal inmutable con su corpusCertificationHash canónico.
 */

'use strict';

const crypto = require('crypto');

class ProductionCorpusCertificationEngine {

    /**
     * Evalúa y certifica el corpus jurídico completo.
     */
    static certifyCorpus(corpusMetadata, corpusUnits) {
        // Validación básica de metadatos del corpus
        if (!corpusMetadata || !corpusMetadata.corpusIdentity || !corpusMetadata.corpusVersion || !corpusMetadata.jobIdentity) {
            return { status: 'PRODUCTION_CORPUS_REJECTED', reason: 'INVALID_CORPUS_METADATA', timestamp: new Date().toISOString() };
        }

        if (!Array.isArray(corpusUnits) || corpusUnits.length === 0) {
            return { status: 'PRODUCTION_CORPUS_REJECTED', reason: 'CORPUS_EMPTY', timestamp: new Date().toISOString() };
        }

        const artifactIdsSeen = new Set();

        for (const unit of corpusUnits) {
            // PC4: Coherencia transversal de jobIdentity (Sin mezclas de ejecuciones)
            if (!unit.artifactId || unit.jobIdentity !== corpusMetadata.jobIdentity) {
                return { status: 'PRODUCTION_CORPUS_REJECTED', reason: 'CORPUS_IDENTITY_CONFLICT', timestamp: new Date().toISOString() };
            }

            if (artifactIdsSeen.has(unit.artifactId)) {
                return { status: 'PRODUCTION_CORPUS_REJECTED', reason: 'DUPLICATE_CORPUS_UNIT', timestamp: new Date().toISOString() };
            }
            artifactIdsSeen.add(unit.artifactId);

            // PC2 & PC3: Clausura de Certificación (Cada unidad debe tener la cadena completa en estado terminal)
            if (unit.certificationRecordStatus !== 'PRODUCTION_CERTIFIED' ||
                unit.manifestStatus !== 'CERTIFIED' ||
                unit.multiFormatStatus !== 'MULTI_FORMAT_CERTIFIED') {
                return { status: 'PRODUCTION_CORPUS_REJECTED', reason: 'CORPUS_INCOMPLETE_OR_UNCLOSED', timestamp: new Date().toISOString() };
            }

            // PC6: Clausura de Procedencia
            if (unit.provenanceStatus !== 'CLOSED') {
                return { status: 'PRODUCTION_CORPUS_REJECTED', reason: 'CORPUS_PROVENANCE_CLOSURE_FAILED', timestamp: new Date().toISOString() };
            }

            // PC7: Clausura de Reproducibilidad (E26.6 obligatorio)
            if (unit.reproductionStatus !== 'REPRODUCTION_VERIFIED') {
                return { status: 'PRODUCTION_CORPUS_REJECTED', reason: 'CORPUS_REPRODUCTION_CLOSURE_FAILED', timestamp: new Date().toISOString() };
            }
        }

        // PC1 & PC8: Cálculo de Hash Canónico Agregado del Corpus (Aislado de timestamps y telemetría)
        const canonicalPayload = {
            corpusIdentity: corpusMetadata.corpusIdentity,
            corpusVersion: corpusMetadata.corpusVersion,
            jobIdentity: corpusMetadata.jobIdentity,
            certifiedUnits: Array.from(artifactIdsSeen).sort()
        };

        const canonicalString = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
        const corpusCertificationHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

        // Emisión del Certificado Terminal Inmutable del Corpus
        return Object.freeze({
            status: 'PRODUCTION_CORPUS_CERTIFIED',
            corpusIdentity: corpusMetadata.corpusIdentity,
            corpusVersion: corpusMetadata.corpusVersion,
            corpusCertificationHash: corpusCertificationHash,
            totalUnitsCertified: corpusUnits.length,
            certifiedArtifacts: Array.from(artifactIdsSeen).sort(),
            issuedAt: new Date().toISOString()
        });
    }
}

module.exports = ProductionCorpusCertificationEngine;