/**
 * Adaptador de Integración y Mapeo Visual para el Panel UXP (G1.4).
 * Responsable exclusivamente de extraer parámetros de los elementos de UI
 * y transformar el feedback en propiedades de renderizado, sin contener
 * lógica de compilación ni invadir la Production Baseline.
 */
class UxpPanelIntegration {
    /**
     * Extrae, sanea y normaliza los parámetros desde los elementos del DOM o UI simulados.
     * @param {Object} elementos - Contenedor de elementos de UI con propiedad .value
     * @returns {Object} Payload listo para el controlador/bridge
     */
    static recopilarParametros(elementos = {}) {
        const payload = {};

        if (elementos.inputPath && typeof elementos.inputPath.value === 'string') {
            const val = elementos.inputPath.value.trim();
            if (val) payload.input = val;
        }

        if (elementos.semanticMapPath && typeof elementos.semanticMapPath.value === 'string') {
            const val = elementos.semanticMapPath.value.trim();
            if (val) payload.semanticMap = val;
        }

        if (elementos.cssPath && typeof elementos.cssPath.value === 'string') {
            const val = elementos.cssPath.value.trim();
            if (val) payload.css = val;
        }

        if (elementos.outputPath && typeof elementos.outputPath.value === 'string') {
            const val = elementos.outputPath.value.trim();
            if (val) payload.output = val;
        }

        if (elementos.profilePath && typeof elementos.profilePath.value === 'string') {
            const val = elementos.profilePath.value.trim();
            if (val) {
                payload.profile = val;
            }
        }

        return payload;
    }

    /**
     * Mapea un objeto de feedback interpretado a propiedades de renderizado para componentes de UI.
     * @param {Object} feedback - Objeto proveniente de UxpFeedbackAdapter
     * @returns {Object} Propiedades de presentación visual
     */
    static mapearAPropiedadesUI(feedback = {}) {
        const severity = feedback.severity || 'info';
        const duration = feedback.metricsSummary?.durationMs || 0;
        const nodes = feedback.metricsSummary?.nodeCount || 0;
        const showMetrics = duration > 0 || nodes > 0;

        return {
            bannerVariant: severity,
            headingText: feedback.title || 'Estado de Operación',
            bodyText: feedback.message || '',
            showMetrics,
            metricsText: `Duración: ${duration} ms | Nodos procesados: ${nodes}`
        };
    }
}

module.exports = {
    UxpPanelIntegration
};