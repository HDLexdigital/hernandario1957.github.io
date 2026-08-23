/**
 * E24.5.2 — SessionHandshakeEngine
 * 
 * - Orquesta el establecimiento de la sesión física (UXP/InDesign) para una ejecución lógica de Node.js.
 * - Garantiza que InDesign confirme el jobIdentity y executionId antes de otorgar el sessionId.
 * - Provee el validador estricto `validateCommandAuth` que exige sessionId para cualquier acción pos-handshake.
 * - Sella la sesión (CLOSED) garantizando terminalidad.
 */

'use strict';

class SessionHandshakeEngine {
    /**
     * Establece el handshake con el host físico.
     * @param {Object} context - Contexto lógico (jobIdentity, executionId).
     * @param {Function} hostConnector - Función asíncrona IPC hacia UXP.
     * @returns {Object} Estado de sesión resultante.
     */
    static async establishSession(context, hostConnector) {
        if (!context || !context.jobIdentity || !context.executionId) {
            return { status: 'REJECTED', reason: 'MISSING_CONTEXT' };
        }

        const request = {
            type: 'HANDSHAKE_REQUEST',
            protocolVersion: context.protocolVersion || 'LEX_UXP_IPC_V1',
            jobIdentity: context.jobIdentity,
            executionId: context.executionId
        };

        let response;
        try {
            response = await hostConnector(request);
        } catch (err) {
            return { status: 'ABORTED', reason: 'HOST_CONNECTION_FAILED' };
        }

        // Rechazo estructural
        if (!response || response.status !== 'ACK' || !response.sessionId) {
            return { status: 'REJECTED', reason: 'HOST_REJECTED_HANDSHAKE' };
        }

        // Validación estricta del binding lógico-físico
        if (response.jobIdentity !== context.jobIdentity || response.executionId !== context.executionId) {
            return { status: 'REJECTED', reason: 'CONTEXT_MISMATCH' };
        }

        // Invariante H9: Cero mutaciones editoriales permitidas durante Handshake
        if (response.mutations !== undefined && response.mutations > 0) {
            return { status: 'ABORTED', reason: 'EDITORIAL_MUTATION_DURING_HANDSHAKE' };
        }

        return {
            status: 'ESTABLISHED',
            state: 'ACTIVE',
            jobIdentity: context.jobIdentity,
            executionId: context.executionId,
            sessionId: response.sessionId,
            workspaceId: response.workspaceId,
            protocolVersion: response.protocolVersion,
            establishedAt: new Date().toISOString()
        };
    }

    /**
     * Valida que un comando físico posterior esté blindado por el sessionId activo.
     * @param {Object} session - El objeto de sesión vigente.
     * @param {Object} command - El comando editorial a evaluar.
     * @returns {Object} { authorized: boolean, reason?: string }
     */
    static validateCommandAuth(session, command) {
        if (!session || session.status !== 'ESTABLISHED' || session.state !== 'ACTIVE') {
            return { authorized: false, reason: 'SESSION_NOT_ACTIVE' };
        }
        if (!command || !command.sessionId) {
            return { authorized: false, reason: 'MISSING_SESSION_ID' };
        }
        if (command.sessionId !== session.sessionId) {
            return { authorized: false, reason: 'SESSION_ID_MISMATCH' };
        }
        return { authorized: true };
    }

    /**
     * Sella de manera terminal una sesión activa, impidiendo reutilización física.
     * @param {Object} session - Sesión a cerrar.
     * @returns {Object} Sesión cerrada.
     */
    static closeSession(session) {
        if (!session || session.status !== 'ESTABLISHED') return session;
        const closedSession = JSON.parse(JSON.stringify(session)); // Inmutabilidad defensiva
        closedSession.state = 'CLOSED';
        closedSession.closedAt = new Date().toISOString();
        return closedSession;
    }
}

module.exports = SessionHandshakeEngine;