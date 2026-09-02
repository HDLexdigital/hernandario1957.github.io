/**
 * E25.2 — Primitive Dispatcher & IPC Transport Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Transporte Físico:
 * - 1. SUCCESS: 1 comando exitoso.
 * - 2. SEQUENTIAL: N comandos respetan orden estrictamente secuencial sin bloquear Node.js.
 * - 3. HALT ON ERROR: ERROR en comando N detiene la cola (Fail-Fast).
 * - 4. HALT ON TIMEOUT: TIMEOUT en comando N genera estado terminal y detiene la cola.
 * - 5. JSON-SAFE: Payload con funciones o ciclos es rechazado ANTES de tocar el puente IPC.
 * - 6. LEDGER: El resultado es un Ledger determinista (executed, failed, notAttempted).
 * - 7. CORRELATION (COMMAND): Respuesta con commandId incorrecto genera CORRELATION_ERROR_COMMAND_ID.
 * - 8. CORRELATION (SESSION): Respuesta con sessionId o executionId incorrecto genera error de correlación.
 */

'use strict';

const PrimitiveDispatcherEngine = require('../../../src/validadores/E25/PrimitiveDispatcherEngine');

describe('E25.2 — Primitive Dispatcher Contract', () => {

    const createCommands = (count) => {
        return Array.from({ length: count }, (_, i) => ({
            commandId: `CMD_TEST_${i}`,
            jobIdentity: 'JOB_LEX_001',
            executionId: 'EXEC_001',
            sessionId: 'PHYS_SESSION_999',
            payload: { primitiveType: 'TEST_OP', index: i }
        }));
    };

    const mockSuccessIpc = async (cmd) => ({
        status: 'SUCCESS',
        commandId: cmd.commandId,
        executionId: cmd.executionId,
        sessionId: cmd.sessionId
    });

    test('E25.2.1: 1 comando -> SUCCESS', async () => {
        const commands = createCommands(1);
        const ledger = await PrimitiveDispatcherEngine.dispatchAll(commands, mockSuccessIpc);
        
        expect(ledger.status).toBe('SUCCESS');
        expect(ledger.executed.length).toBe(1);
        expect(ledger.notAttempted.length).toBe(0);
        expect(ledger.failed).toBeNull();
    });

    test('E25.2.2: N comandos -> orden estrictamente secuencial', async () => {
        const commands = createCommands(3);
        const executionOrder = [];
        
        const trackingIpc = async (cmd) => {
            executionOrder.push(cmd.payload.index);
            return mockSuccessIpc(cmd);
        };

        const ledger = await PrimitiveDispatcherEngine.dispatchAll(commands, trackingIpc);
        
        expect(ledger.status).toBe('SUCCESS');
        expect(executionOrder).toEqual([0, 1, 2]); // Secuencialidad estricta
    });

    test('E25.2.3: ERROR en N -> HALT (Fail-Fast)', async () => {
        const commands = createCommands(3);
        
        const errorIpc = async (cmd) => {
            if (cmd.payload.index === 1) {
                return { ...await mockSuccessIpc(cmd), status: 'ERROR', error: 'FONT_MISSING' };
            }
            return mockSuccessIpc(cmd);
        };

        const ledger = await PrimitiveDispatcherEngine.dispatchAll(commands, errorIpc);
        
        expect(ledger.status).toBe('HALTED');
        expect(ledger.executed.length).toBe(1); // Comando 0 pasó
        expect(ledger.failed.command.commandId).toBe('CMD_TEST_1'); // Comando 1 falló
        expect(ledger.failed.reason).toBe('FONT_MISSING');
        expect(ledger.notAttempted.length).toBe(1); // Comando 2 no se intentó
    });

    test('E25.2.4: TIMEOUT en N -> HALT + PRIMITIVE_TIMEOUT', async () => {
        const commands = createCommands(2);
        
        const timeoutIpc = async (cmd) => {
            if (cmd.payload.index === 1) {
                // Simula un cuelgue infinito REAL del host físico (sin usar setTimeout)
                return new Promise(() => {}); 
            }
            return mockSuccessIpc(cmd);
        };

        // Forzamos un timeout físico de 50ms
        const ledger = await PrimitiveDispatcherEngine.dispatchAll(commands, timeoutIpc, { primitiveTimeoutMs: 50 });
        
        expect(ledger.status).toBe('HALTED');
        expect(ledger.failed.reason).toBe('PRIMITIVE_TIMEOUT');
        expect(ledger.notAttempted.length).toBe(0);
    });

    test('E25.2.5: Payload no JSON-safe -> IPC jamás invocado', async () => {
        const commands = createCommands(1);
        commands[0].payload.hack = () => { console.log("Malicious Function"); }; // Inyección de función
        
        let ipcCalled = false;
        const spyIpc = async (cmd) => { ipcCalled = true; return mockSuccessIpc(cmd); };

        const ledger = await PrimitiveDispatcherEngine.dispatchAll(commands, spyIpc);
        
        expect(ledger.status).toBe('HALTED');
        expect(ledger.failed.reason).toBe('JSON_SAFE_VIOLATION');
        expect(ipcCalled).toBe(false); // Frontera física protegida
    });

    test('E25.2.6: Validación de estructura del Ledger de Ejecución', async () => {
        const commands = createCommands(2);
        const ledger = await PrimitiveDispatcherEngine.dispatchAll(commands, mockSuccessIpc);
        
        expect(ledger).toHaveProperty('executionId', 'EXEC_001');
        expect(ledger).toHaveProperty('sessionId', 'PHYS_SESSION_999');
        expect(ledger).toHaveProperty('status');
        expect(ledger).toHaveProperty('executed');
        expect(ledger).toHaveProperty('failed');
        expect(ledger).toHaveProperty('notAttempted');
    });

    test('E25.2.7: Respuesta con commandId incorrecto -> CORRELATION_ERROR', async () => {
        const commands = createCommands(1);
        
        const badCommandIdIpc = async (cmd) => ({
            ...await mockSuccessIpc(cmd),
            commandId: 'CMD_HACKED_OR_OLD'
        });

        const ledger = await PrimitiveDispatcherEngine.dispatchAll(commands, badCommandIdIpc);
        
        expect(ledger.status).toBe('HALTED');
        expect(ledger.failed.reason).toBe('CORRELATION_ERROR_COMMAND_ID');
    });

    test('E25.2.8: Respuesta con sessionId incorrecto -> CORRELATION_ERROR', async () => {
        const commands = createCommands(1);
        
        const badSessionIpc = async (cmd) => ({
            ...await mockSuccessIpc(cmd),
            sessionId: 'PHYS_SESSION_998_OLD'
        });

        const ledger = await PrimitiveDispatcherEngine.dispatchAll(commands, badSessionIpc);
        
        expect(ledger.status).toBe('HALTED');
        expect(ledger.failed.reason).toBe('CORRELATION_ERROR_SESSION_ID');
    });
});