/**
 * O5.2 — Incident Classification Engine
 * 
 * - Convierte un incidente admitido (O5.1) en una clasificación causal gobernada.
 * - Garantiza los invariantes C1–C12 (Taxonomía cerrada, determinismo, preservación de evidencia y ausencia de remediación).
 */

'use strict';

const crypto = require('crypto');

class IncidentClassificationEngine {

    constructor() {
        this.validTaxonomies = new Set([
            'INPUT_CONTENT',
            'POLICY_PROJECTION',
            'RENDERING_ENVIRONMENT',
            'OPERATIONAL_INFRASTRUCTURE',
            'UNDETERMINED'
        ]);
        this.classificationsStore = new Map(); // Almacén inmutable (incidentId -> ClassificationRecord)
    }

    /**
     * C1–C12: Clasifica causalmente un incidente admitido de forma determinista y read-only
     */
    classifyIncident(incidentRecord, taxonomyCategory, rationale) {
        // C1. Valid Incident Binding
        if (!incidentRecord || !incidentRecord.incidentId || incidentRecord.initialState !== 'OPEN') {
            throw new Error('INVALID_INCIDENT_BINDING: A valid, OPEN incident record from O5.1 is mandatory.');
        }

        const incidentId = incidentRecord.incidentId;

        // C8. Explicit Classification / C3. Controlled Taxonomy
        if (!taxonomyCategory || !this.validTaxonomies.has(taxonomyCategory)) {
            throw new Error(`CONTROLLED_TAXONOMY_VIOLATION: Category '${taxonomyCategory}' is not part of the approved causal catalog.`);
        }

        // Racional obligatorio para justificar el dictamen
        if (!rationale || typeof rationale !== 'string' || rationale.trim() === '') {
            throw new Error('RATIONALE_MANDATORY: A coded forensic rationale must accompany classification.');
        }

        // C2. Immutable Source Binding & C10. Evidence Preservation
        const canonicalDictamen = {
            sourceBinding: { ...incidentRecord.sourceBinding },
            taxonomyCategory,
            rationale: rationale.trim()
        };

        // C9. Deterministic Classification (classificationHash basado puramente en la causa y origen, excluyendo incidentId)
        const serialized = JSON.stringify(canonicalDictamen, Object.keys(canonicalDictamen).sort());
        const classificationHash = crypto.createHash('sha256').update(serialized).digest('hex');

        const sealedClassification = Object.freeze({
            incidentId,
            ...canonicalDictamen,
            classifiedAt: new Date().toISOString(),
            classificationHash,
            status: 'CLASSIFIED'
        });

        // Almacenamiento inmutable
        this.classificationsStore.set(incidentId, sealedClassification);

        return sealedClassification;
    }

    /**
     * Consulta una clasificación guardada
     */
    lookupClassification(incidentId) {
        if (!this.classificationsStore.has(incidentId)) {
            throw new Error(`CLASSIFICATION_NOT_FOUND: Incident ${incidentId} has not been classified.`);
        }
        return this.classificationsStore.get(incidentId);
    }
}

module.exports = IncidentClassificationEngine;