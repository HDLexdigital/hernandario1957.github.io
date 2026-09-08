const { UxpFeedbackAdapter } = require('../../../src/uxp/UxpFeedbackAdapter');

describe('G1.3 — Adaptador de Feedback y Presentación UXP (UxpFeedbackAdapter)', () => {
    test('G1.3.1 — Mapea exitCode 0 a un modelo visual de éxito limpio', () => {
        const resultadoBruto = {
            success: true,
            exitCode: 0,
            stdout: 'Compilación OK',
            stderr: '',
            outputPath: 'C:/salida/index.xhtml',
            metrics: { durationMs: 450, nodeCount: 120 }
        };

        const feedback = UxpFeedbackAdapter.interpretar(resultadoBruto);

        expect(feedback.severity).toBe('success');
        expect(feedback.code).toBe(0);
        expect(feedback.title).toBeDefined();
        expect(feedback.message).toBe('Compilación OK');
        expect(feedback.actionable).toBe(false);
        expect(feedback.metricsSummary.durationMs).toBe(450);
        expect(feedback.metricsSummary.nodeCount).toBe(120);
    });

    test('G1.3.2 — Mapea códigos operacionales 1–5 a niveles de severidad y categorías legibles', () => {
        const codigosEsperados = [
            { code: 1, categoria: 'CONFIG_ERROR', severidad: 'error' },
            { code: 2, categoria: 'INPUT_IO_ERROR', severidad: 'error' },
            { code: 3, categoria: 'ADAPTER_ERROR', severidad: 'error' },
            { code: 4, categoria: 'CORE_COMPILATION_ERROR', severidad: 'error' },
            { code: 5, categoria: 'VALIDATION_FAILED', severidad: 'warning' }
        ];

        for (const item of codigosEsperados) { // <-- Corregido con (const item of ...)
            const resultadoBruto = {
                success: false,
                exitCode: item.code,
                stdout: '',
                stderr: 'Detalle del fallo',
                diagnostics: { category: item.categoria }
            };

            const feedback = UxpFeedbackAdapter.interpretar(resultadoBruto);
            expect(feedback.code).toBe(item.code);
            expect(feedback.severity).toBe(item.severidad);
            expect(feedback.category).toBe(item.categoria);
            expect(feedback.actionable).toBe(true);
            expect(feedback.message).toBe('Detalle del fallo');
        }
    });

    test('G1.3.3 — Formatea y normaliza métricas vacías o ausentes de F13 de forma segura', () => {
        const resultadoBruto = {
            success: true,
            exitCode: 0,
            stdout: '',
            stderr: ''
        };

        const feedback = UxpFeedbackAdapter.interpretar(resultadoBruto);
        expect(feedback.metricsSummary).toEqual({
            durationMs: 0,
            nodeCount: 0
        });
    });
});