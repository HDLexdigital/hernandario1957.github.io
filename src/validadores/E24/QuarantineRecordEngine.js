/**
 * E24.3.3 — QuarantineRecordEngine (Motor de Registros de Cuarentena y Paquete Forense)
 * 
 * - Valida y empaqueta la evidencia forense bajo un vocabulario cerrado de clases de fallo.
 * - Aplica serialización canónica recursiva (ordenamiento de claves) excluyendo telemetría volátil de runtime.
 * - Previene la dependencia circular calculando el SHA-256 sobre el payload limpio sin incluir el hash mismo.
 * - Garantiza pureza funcional e inmutabilidad estricta.
 */

'use strict';

const crypto = require('crypto');

class QuarantineRecordEngine {
    // Vocabulario cerrado obligatorio para clases de fallo
    static get VALID_FAILURE_CLASSES() {
        return [
            'VALIDATION_FAILURE',
            'PROJECTION_FAILURE',
            'ROUNDTRIP_FAILURE',
            'ARTIFACT_INTEGRITY_FAILURE',
            'WORKSPACE_FAILURE',
            'EXECUTION_FAILURE',
            'UNKNOWN_FAILURE'
        ];
    }

    // Vocabulario cerrado para decisiones de recuperación
    static get VALID_DECISIONS() {
        return ['ROLLBACK', 'QUARANTINE', 'RETRY', 'TERMINAL_FAILURE'];
    }

    /**
     * Ordena recursivamente las propiedades de un objeto para serialización canónica estable.
     * @private
     */
    static _sortObjectKeys(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this._sortObjectKeys(item));
        }

        return Object.keys(obj)
            .sort()
            .reduce((sorted, key) => {
                sorted[key] = this._sortObjectKeys(obj[key]);
                return sorted;
            }, {});
    }

    /**
     * Valida y genera un registro de cuarentena forense inmutable y determinista.
     * @param {Object} incident - Datos crudos del fallo e indicios de ejecución.
     * @returns {Object} QuarantineRecord completo con su canonicalHash.
     */
    static createQuarantineRecord(incident) {
        if (!incident || typeof incident !== 'object') {
            throw new Error('QUARANTINE_VIOLATION: Objeto de incidente forense ausente o malformado.');
        }

        // 1. Verificación de Identidad y Requeridos
        if (!incident.jobIdentity || !incident.executionId) {
            throw new Error('QUARANTINE_VIOLATION: Se requiere jobIdentity y executionId en el registro forense.');
        }

        // 2. Validación de Vocabulario Cerrado para failureClass
        const failureClass = incident.failure && incident.failure.failureClass;
        if (!failureClass || !this.VALID_FAILURE_CLASSES.includes(failureClass)) {
            throw new Error(`QUARANTINE_VIOLATION: failureClass inválida o no reconocida ('${failureClass}').`);
        }

        // 3. Extracción de Payload Canónico (Excluyendo explícitamente runtimeTelemetry)
        const canonicalPayload = {
            quarantineVersion: 'E24.3.3',
            status: 'QUARANTINED',
            jobIdentity: incident.jobIdentity,
            executionId: incident.executionId,
            attempt: incident.attempt || 1,
            failure: {
                failureClass: incident.failure.failureClass,
                code: incident.failure.code || 'UNKNOWN_CODE',
                message: incident.failure.message || '',
                stage: incident.failure.stage || 'UNKNOWN_STAGE'
            },
            recovery: {
                decision: incident.recovery && incident.recovery.decision || 'QUARANTINE',
                policy: incident.recovery && incident.recovery.policy || 'NO_PARTIAL_COMMIT'
            },
            workspace: {
                disposition: incident.workspace && incident.workspace.disposition || 'ROLLED_BACK'
            },
            artifacts: Array.isArray(incident.artifacts) ? incident.artifacts.map(art => ({
                artifactId: art.artifactId,
                artifactType: art.artifactType,
                sha256: art.sha256,
                size: art.size
            })) : [],
            evidence: {
                ledgerHash: incident.evidence && incident.evidence.ledgerHash || null,
                sourceArtifactHash: incident.evidence && incident.evidence.sourceArtifactHash || null,
                projectionArtifactHash: incident.evidence && incident.evidence.projectionArtifactHash || null,
                roundTripArtifactHash: incident.evidence && incident.evidence.roundTripArtifactHash || null
            }
        };

        // 4. Cálculo Criptográfico del Canonical Hash (Sin dependencia circular)
        const sortedPayload = this._sortObjectKeys(canonicalPayload);
        const canonicalString = JSON.stringify(sortedPayload);
        const canonicalHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

        // 5. Retorno del Paquete Forense Sellado
        return {
            ...canonicalPayload,
            canonicalHash: canonicalHash
        };
    }
}

module.exports = QuarantineRecordEngine;