/**
 * E24.5.2 — Session Handshake Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Establecimiento de Sesión Física (InDesign):
 * - H1. SESSION IDENTITY: Un handshake válido produce ESTABLISHED con job, execution y sessionId correlacionados.
 * - H2. CONTEXT BINDING: Rechaza si jobIdentity falta o no coincide con la respuesta física.
 * - H3. ATOMICITY & FAILURE: Un fallo de host produce ABORTED sin sesión residual.
 * - H4/H7. REPLAY SEPARATION: Dos ejecuciones distintas del mismo job obtienen sessionIds físicos diferentes.
 * - H5. SESSION AUTHORITY: Toda operación pos-handshake sin sessionId es estrictamente RECHAZADA.
 * - H6/H8. NO CROSS SESSION: Una sesión rechaza comandos que porten el sessionId de otra ejecución.
 * - H9. NO EDITORIAL MUTATION: El handshake físico garantiza explícitamente 0 mutaciones editoriales.
 * - H10. SESSION TERMINALITY: Una sesión en estado CLOSED jamás puede ser reutilizada para nuevos comandos.
 */

'use strict';

const crypto = require('crypto');
const SessionHandshakeEngine = require('../../../src/validadores/E24/SessionHandshakeEngine');

describe('E24.5.2 — Session Handshake Contract', () => {

    const baseContext = Object.freeze({
        jobIdentity: 'JOB_LEX_ALPHA_001',
        executionId: 'EXEC_001',
        protocolVersion: 'LEX_UXP_IPC_V1'
    });

    // Simulador de UXP/InDesign IPC
    const mockHostConnector = async (request) => {
        return {
            status: 'ACK',
            protocolVersion: request.protocolVersion,
            jobIdentity: request.jobIdentity,
            executionId: request.executionId,
            sessionId: crypto.randomBytes(16).toString('hex'),
            workspaceId: 'WS_TEMP_' + Date.now(),
            mutations: 0
        };
    };

    test('H1 & H6. SESSION IDENTITY: Establish valid session with isolated workspace', async () => {
        const session = await SessionHandshakeEngine.establishSession(baseContext, mockHostConnector);
        
        expect(session.status).toBe('ESTABLISHED');
        expect(session.state).toBe('ACTIVE');
        expect(session.jobIdentity).toBe(baseContext.jobIdentity);
        expect(session.executionId).toBe(baseContext.executionId);
        expect(session.sessionId).toBeDefined();
        expect(session.workspaceId).toMatch(/^WS_TEMP_/);
    });

    test('H2. CONTEXT BINDING: Rechaza establecimiento si InDesign devuelve jobIdentity incorrecto', async () => {
        const maliciousHost = async (req) => {
            const res = await mockHostConnector(req);
            res.jobIdentity = 'JOB_HACKED_009'; // InDesign devuelve un job distinto
            return res;
        };

        const session = await SessionHandshakeEngine.establishSession(baseContext, maliciousHost);
        expect(session.status).toBe('REJECTED');
        expect(session.reason).toBe('CONTEXT_MISMATCH');
    });

    test('H3. ATOMICITY & FAILURE: Un fallo de conexión no deja sesión parcial (ABORTED)', async () => {
        const brokenHost = async () => { throw new Error('IPC_BROKEN_PIPE'); };

        const session = await SessionHandshakeEngine.establishSession(baseContext, brokenHost);
        expect(session.status).toBe('ABORTED');
        expect(session.reason).toBe('HOST_CONNECTION_FAILED');
        expect(session.sessionId).toBeUndefined();
    });

    test('H4 & H7. REPLAY SEPARATION: Distintos attempts del mismo job producen sessionIds diferentes', async () => {
        const contextA = { ...baseContext, executionId: 'EXEC_ATTEMPT_1' };
        const contextB = { ...baseContext, executionId: 'EXEC_ATTEMPT_2' };

        const sessionA = await SessionHandshakeEngine.establishSession(contextA, mockHostConnector);
        const sessionB = await SessionHandshakeEngine.establishSession(contextB, mockHostConnector);

        expect(sessionA.jobIdentity).toBe(sessionB.jobIdentity); // Mismo Job
        expect(sessionA.executionId).not.toBe(sessionB.executionId); // Distinto Intento
        expect(sessionA.sessionId).not.toBe(sessionB.sessionId); // Diferente autoridad física
    });

    test('H5. SESSION AUTHORITY: Operaciones editoriales pos-handshake sin sessionId son rechazadas', async () => {
        const session = await SessionHandshakeEngine.establishSession(baseContext, mockHostConnector);
        
        const maliciousCommand = { command: 'INSERT_TEXT' }; // Falta sessionId

        const auth = SessionHandshakeEngine.validateCommandAuth(session, maliciousCommand);
        expect(auth.authorized).toBe(false);
        expect(auth.reason).toBe('MISSING_SESSION_ID');
    });

    test('H6 & H8. NO CROSS SESSION: Una sesión rechaza comandos originados en otra sesión física', async () => {
        const sessionReal = await SessionHandshakeEngine.establishSession(baseContext, mockHostConnector);
        
        const commandFromOtherExecution = { 
            sessionId: 'SESSION_ID_HACK_999', 
            command: 'RENDER_PDF' 
        };

        const auth = SessionHandshakeEngine.validateCommandAuth(sessionReal, commandFromOtherExecution);
        expect(auth.authorized).toBe(false);
        expect(auth.reason).toBe('SESSION_ID_MISMATCH');
    });

    test('H9. NO EDITORIAL MUTATION: El handshake rechaza la sesión si InDesign reporta mutaciones', async () => {
        const mutatingHost = async (req) => {
            const res = await mockHostConnector(req);
            res.mutations = 1; // El handshake no debe mutar el AST ni el documento
            return res;
        };

        const session = await SessionHandshakeEngine.establishSession(baseContext, mutatingHost);
        expect(session.status).toBe('ABORTED');
        expect(session.reason).toBe('EDITORIAL_MUTATION_DURING_HANDSHAKE');
    });

    test('H10. SESSION TERMINALITY: Una sesión CLOSED no puede autorizar más operaciones', async () => {
        const session = await SessionHandshakeEngine.establishSession(baseContext, mockHostConnector);
        const closedSession = SessionHandshakeEngine.closeSession(session);
        
        expect(closedSession.state).toBe('CLOSED');

        const legitimateCommand = { sessionId: closedSession.sessionId, command: 'EXPORT' };
        
        const auth = SessionHandshakeEngine.validateCommandAuth(closedSession, legitimateCommand);
        expect(auth.authorized).toBe(false);
        expect(auth.reason).toBe('SESSION_NOT_ACTIVE');
    });
});