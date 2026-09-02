/**
 * E25.5.3 — Export Tag Projection Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Proyección y Verificación de Etiquetas de Exportación (EPUB3 / WCAG):
 * - 1. VALID MAPPING: Un styleId válido proyecta su exportTag determinista exacto.
 * - 2. DETERMINISTIC MAPPING: Idéntico styleId produce siempre idéntico tag sin inferencias de runtime.
 * - 3. INVALID TAG REJECTION: Tags vacíos o estructuralmente no permitidos lanzan INVALID_EXPORT_TAG.
 * - 4. MISSING TAG REJECTION: Estilos sin mapping de exportación lanzan EXPORT_TAG_NOT_FOUND sin fallbacks.
 * - 5. ATOMIC ROLLBACK: Fallo en la inyección de la etiqueta revoca la mutación preservando el estado original.
 * - 6. ROUND-TRIP METADATA: Lectura posterior (Read-back) demuestra que el DOM físico refleja el tag certificado.
 */

'use strict';

const ExportTagProjectionEngine = require('../../../src/validadores/E25/ExportTagProjectionEngine');

describe('E25.5.3 — Export Tag Projection Contract', () => {

    let mockInDesignHost;

    const baseCommand = Object.freeze({
        commandId: 'CMD_TAG_001',
        executionId: 'EXEC_001',
        sessionId: 'SESSION_999',
        targetWorkspace: 'WS_001'
    });

    beforeEach(() => {
        mockInDesignHost = {
            activeWorkspaceId: 'WS_001',
            resources: {
                paragraphStyles: {
                    'P02_TITLE_PART': { id: 'P02_TITLE_PART', kind: 'PARAGRAPH', exportTag: 'h1' },
                    'BODY_TEXT': { id: 'BODY_TEXT', kind: 'PARAGRAPH', exportTag: 'p' },
                    'UNMAPPED_STYLE': { id: 'UNMAPPED_STYLE', kind: 'PARAGRAPH' } // Sin mapping
                }
            },
            dom: {
                appliedStyles: {}
            }
        };
    });

    test('E25.5.3.1 & 2. VALID & DETERMINISTIC MAPPING: Proyecta el tag sin entropía de runtime', () => {
        const cmd = {
            ...baseCommand,
            payload: { styleId: 'P02_TITLE_PART', styleKind: 'PARAGRAPH' }
        };

        const result = ExportTagProjectionEngine.projectExportTag(cmd, mockInDesignHost);

        expect(result.status).toBe('SUCCESS');
        expect(result.assignedExportTag).toBe('h1');
    });

    test('E25.5.3.3. INVALID TAG REJECTION: Rechaza tags vacíos o malformados', () => {
        const cmd = {
            ...baseCommand,
            payload: { styleId: 'P02_TITLE_PART', styleKind: 'PARAGRAPH', overrideTag: '   ' } // Tag inválido/vacío
        };

        const result = ExportTagProjectionEngine.projectExportTag(cmd, mockInDesignHost);

        expect(result.status).toBe('ERROR');
        expect(result.reason).toBe('INVALID_EXPORT_TAG');
    });

    test('E25.5.3.4. MISSING TAG REJECTION: Estilos sin mapping estricto fallan sin fallback a "p"', () => {
        const cmd = {
            ...baseCommand,
            payload: { styleId: 'UNMAPPED_STYLE', styleKind: 'PARAGRAPH' }
        };

        const result = ExportTagProjectionEngine.projectExportTag(cmd, mockInDesignHost);

        expect(result.status).toBe('ERROR');
        expect(result.reason).toBe('EXPORT_TAG_NOT_FOUND');
    });

    test('E25.5.3.5. ATOMIC ROLLBACK: Fallo transaccional revoca la asignación parcial', () => {
        const cmd = {
            ...baseCommand,
            payload: { styleId: 'BODY_TEXT', styleKind: 'PARAGRAPH', simulateCrash: true }
        };

        mockInDesignHost.dom.appliedStyles['BODY_TEXT'] = { exportTag: 'original_tag' };

        const result = ExportTagProjectionEngine.projectExportTag(cmd, mockInDesignHost);

        expect(result.status).toBe('ERROR');
        expect(result.reason).toBe('EXPORT_TAG_APPLICATION_ROLLED_BACK');
        // Verificación de atomicidad: El DOM físico conserva el estado previo intacto
        expect(mockInDesignHost.dom.appliedStyles['BODY_TEXT'].exportTag).toBe('original_tag');
    });

    test('E25.5.3.6. ROUND-TRIP METADATA: La lectura posterior (Read-back) corrobora el tag en el DOM', () => {
        const cmd = {
            ...baseCommand,
            payload: { styleId: 'P02_TITLE_PART', styleKind: 'PARAGRAPH' }
        };

        // 1. Proyectamos
        ExportTagProjectionEngine.projectExportTag(cmd, mockInDesignHost);

        // 2. Ejecutamos el Read-back forense sobre el DOM real simulado
        const verifiedTag = ExportTagProjectionEngine.readBackExportTag('P02_TITLE_PART', mockInDesignHost);

        expect(verifiedTag).toBe('h1');
    });
});