const { ColectorMetricas } = require('../../../src/observability/CompilationMetrics');

describe('F13.3 — Métricas de Compilación', () => {
    test('F13.3.1 — Inicializa con contadores en cero y estado base', () => {
        const colector = new ColectorMetricas();
        const resumen = colector.obtenerResumen();

        expect(resumen.durationMs).toBe(0);
        expect(resumen.nodeCount).toBe(0);
        expect(resumen.paragraphs).toBe(0);
        expect(resumen.characterRuns).toBe(0);
        expect(resumen.warningsCount).toBe(0);
        expect(resumen.errorsCount).toBe(0);
        expect(resumen.finalResult).toBe('PENDING');
    });

    test('F13.3.2 — Permite registrar métricas de nodos y texto acumulativamente', () => {
        const colector = new ColectorMetricas();
        
        colector.registrarMetricasAST({ nodeCount: 50, paragraphs: 10, characterRuns: 1200 });
        colector.registrarAdvertencia();
        colector.registrarError();

        const resumen = colector.obtenerResumen();
        expect(resumen.nodeCount).toBe(50);
        expect(resumen.paragraphs).toBe(10);
        expect(resumen.characterRuns).toBe(1200);
        expect(resumen.warningsCount).toBe(1);
        expect(resumen.errorsCount).toBe(1);
    });

    test('F13.3.3 — Mide la duración de la compilación de forma controlada', () => {
        const colector = new ColectorMetricas();
        
        colector.iniciarCronometro();
        // Simulamos un breve retraso
        const inicio = Date.now();
        while (Date.now() - inicio < 10) { /* espera activa breve */ }
        colector.finalizarCronometro('SUCCESS');

        const resumen = colector.obtenerResumen();
        expect(resumen.durationMs).toBeGreaterThanOrEqual(5);
        expect(resumen.finalResult).toBe('SUCCESS');
    });
});