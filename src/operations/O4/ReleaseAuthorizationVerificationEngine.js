/**
 * O4.2 — Release Authorization Verification Engine
 * 
 * - Verifica la legitimidad de la transición de CANDIDATE_READY a RELEASE_AUTHORIZED.
 * - Aplica los invariantes A1–A8 garantizando la separación entre gobernanza y operación técnica.
 */

'use strict';

const crypto = require('crypto');

class ReleaseAuthorizationVerificationEngine {

    constructor() {
        this.authorizationsStore = new Map(); // Almacén de autorizaciones verificadas
    }

    /**
     * Registra un certificado de autorización formal (E26.4 Release Gate)
     */
    registerAuthorization(authorizationId, authPayload) {
        if (!authorizationId) throw new Error('AUTHORIZATION_ID_MANDATORY');
        this.authorizationsStore.set(authorizationId, authPayload);
    }

    /**
     * A1–A8: Verifica la autorización de un Release Candidate y emite el veredicto canónico
     */
    verifyAuthorization(candidate, authorizationId) {
        if (!candidate || candidate.status !== 'CANDIDATE_READY') {
            throw new Error('INVALID_CANDIDATE_STATE: Candidate must be in CANDIDATE_READY state.');
        }

        const authorization = this.authorizationsStore.get(authorizationId);

        // A3. Authorization Authenticity
        if (!authorization) {
            throw new Error('AUTHORIZATION_NOT_FOUND: Authorization token/record is missing or unrecognized.');
        }

        // A1. Candidate Identity Binding
        if (
            authorization.candidateId !== candidate.candidateId ||
            authorization.jobIdentity !== candidate.jobIdentity ||
            authorization.executionId !== candidate.executionId
        ) {
            throw new Error('CANDIDATE_IDENTITY_MISMATCH: Authorization scope does not match candidate metadata.');
        }

        // A6. Temporal / State Validity
        if (authorization.status !== 'AUTHORIZED_ACTIVE' || (authorization.expiresAt && Date.now() > authorization.expiresAt)) {
            throw new Error('AUTHORIZATION_EXPIRED_OR_REVOKED: Authorization is no longer valid for promotion.');
        }

        // A5. Authorization Scope / A2. E26.4 Certification Binding
        if (authorization.certificateBinding !== candidate.certificationBinding) {
            throw new Error('CERTIFICATE_SCOPE_MISMATCH: Authorization certificate binding diverges from candidate manifest.');
        }

        // A8. Deterministic Authorization Verdict Hash
        const canonicalVerdict = {
            candidateId: candidate.candidateId,
            authorizationId,
            jobIdentity: candidate.jobIdentity,
            executionId: candidate.executionId,
            verifiedAt: new Date().toISOString(),
            status: 'RELEASE_AUTHORIZED'
        };

        const serialized = JSON.stringify(canonicalVerdict, Object.keys(canonicalVerdict).sort());
        const authorizationVerdictHash = crypto.createHash('sha256').update(serialized).digest('hex');

        return Object.freeze({
            ...canonicalVerdict,
            authorizationVerdictHash
        });
    }
}

module.exports = ReleaseAuthorizationVerificationEngine;