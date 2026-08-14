/**
 * Adaptador de Feedback y Presentación UXP (G1.3).
 * Traduce códigos de salida y métricas operacionales a un modelo visual claro
 * para la interfaz del panel UXP, sin alterar la baseline ni la lógica del núcleo.
 */
class UxpFeedbackAdapter {
    /**
     * Interpreta un resultado bruto del bridge y genera un objeto de feedback visual.
     * @param {Object} resultadoBruto - Resultado proveniente de UxpmotorBridge
     * @returns {Object} Modelo de presentación unificado
     */
    static interpretar(resultadoBruto = {}) {
        const exitCode = typeof resultadoBruto.exitCode === 'number' ? resultadoBruto.exitCode : 1;
        const success = resultadoBruto.success === true || exitCode === 0;

        let severity = 'success';
        let title = 'Compilación Exitosa';
        let category = 'SUCCESS';

        if (!success) {
            category = resultadoBruto.diagnostics?.category || UxpFeedbackAdapter._getCategoriaPorDefecto(exitCode);
            // El código 5 (validación) suele tratarse como advertencia/warning normativo según F12/F13
            severity = exitCode === 5 ? 'warning' : 'error';
            title = UxpFeedbackAdapter._getTituloPorCategoria(category);
        }

        const metrics = resultadoBruto.metrics || {};
        const metricsSummary = {
            durationMs: typeof metrics.durationMs === 'number' ? metrics.durationMs : 0,
            nodeCount: typeof metrics.nodeCount === 'number' ? metrics.nodeCount : 0
        };

        return {
            success,
            code: exitCode,
            severity,
            title,
            category,
            message: resultadoBruto.stderr || resultadoBruto.stdout || 'Sin detalles adicionales',
            outputPath: resultadoBruto.outputPath || null,
            actionable: !success,
            metricsSummary
        };
    }

    static _getCategoriaPorDefecto(exitCode) {
        switch (exitCode) {
            case 0: return 'SUCCESS';
            case 1: return 'CONFIG_ERROR';
            case 2: return 'INPUT_IO_ERROR';
            case 3: return 'ADAPTER_ERROR';
            case 4: return 'CORE_COMPILATION_ERROR';
            case 5: return 'VALIDATION_FAILED';
            default: return 'UNKNOWN_ERROR';
        }
    }

    static _getTituloPorCategoria(category) {
        switch (category) {
            case 'CONFIG_ERROR': return 'Error de Configuración';
            case 'INPUT_IO_ERROR': return 'Error de Entrada / Perfil';
            case 'ADAPTER_ERROR': return 'Error del Adaptador InDesign';
            case 'CORE_COMPILATION_ERROR': return 'Error en el Núcleo (Lexmotor Core)';
            case 'VALIDATION_FAILED': return 'Advertencia de Validación Estructural';
            default: return 'Error Operacional';
        }
    }
}

module.exports = {
    UxpFeedbackAdapter
};