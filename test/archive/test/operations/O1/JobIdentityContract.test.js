/**
 * O1.2 — Job Identity & Runtime Contract Suite
 * 
 * Valida los 7 invariantes de la jerarquía operacional de identidades (J1–J7).
 */

'use strict';

const path = require('path');
const JobIdentityRuntimeEngine = require(path.join(process.cwd(), 'src', 'operations', 'O1', 'JobIdentityRuntimeEngine'));

describe('O1.2 — Job Identity & Runtime Contract Suite', () => {

    test('J1 & J7. JOB IDENTITY STABILITY & IMMUTABILITY: Mantiene estabilidad y rechaza mutaciones', () => {
        const runtime = new JobIdentityRuntimeEngine('JOB_CONSTITUTION_COLOMBIA_2026');
        expect(runtime.jobIdentity).toBe('JOB_CONSTITUTION_COLOMBIA_2026');

        // J7: Inmutabilidad estricta (Object.freeze activo)
        expect(() => {
            runtime.jobIdentity = 'MUTATED_JOB';
        }).toThrow();
    });

    test('J2. EXECUTION ISOLATION: Cada instancia genera un executionId único y aislado', () => {
        const runtimeA = new JobIdentityRuntimeEngine('JOB_TEST');
        const runtimeB = new JobIdentityRuntimeEngine('JOB_TEST');

        expect(runtimeA.executionId).not.toBe(runtimeB.executionId);
    });

    test('J3 & J4. SESSION BINDING & COMMAND CORRELATION: Vincula sesión y correlaciona comandos', () => {
        const runtime = new JobIdentityRuntimeEngine('JOB_TEST_SESSION', { executionId: 'EXEC_001', sessionId: 'SES_001' });
        
        const cmdContext = runtime.createCommandContext('RENDER_AST', { target: 'article_37' });

        expect(cmdContext.jobIdentity).toBe('JOB_TEST_SESSION');
        expect(cmdContext.executionId).toBe('EXEC_001');
        expect(cmdContext.sessionId).toBe('SES_001');
        expect(cmdContext.commandId).toMatch(/^CMD_/);
        expect(runtime.commands).toContain(cmdContext.commandId);
    });

    test('J5. IDENTITY PROPAGATION: Propaga el paquete completo de metadatos de identidad', () => {
        const runtime = new JobIdentityRuntimeEngine('JOB_PROPAGATION');
        const payload = runtime.getPropagationPayload();

        expect(payload).toHaveProperty('jobIdentity', 'JOB_PROPAGATION');
        expect(payload).toHaveProperty('executionId');
        expect(payload).toHaveProperty('sessionId');
    });

    test('J6. RUNTIME NOISE ISOLATION: Elimina ruido de sistema operativo (PID, hostname, etc.)', () => {
        const runtime = new JobIdentityRuntimeEngine('JOB_NOISE');
        const noisyMetadata = {
            target: 'chapter_1',
            pid: 4592,
            hostname: 'win11-workstation',
            absolutePath: 'C:\\LexDigital\\file.json'
        };

        const cmd = runtime.createCommandContext('ANALYZE', noisyMetadata);

        expect(cmd.metadata).toHaveProperty('target', 'chapter_1');
        expect(cmd.metadata).not.toHaveProperty('pid');
        expect(cmd.metadata).not.toHaveProperty('hostname');
        expect(cmd.metadata).not.toHaveProperty('absolutePath');
    });
});