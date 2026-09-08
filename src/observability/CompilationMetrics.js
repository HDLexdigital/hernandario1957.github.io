/**
 * Colector periférico de métricas y rendimiento de compilación.
 * Permite registrar contadores y tiempos sin invadir el núcleo canónico.
 */
class ColectorMetricas {
    constructor() {
        this.durationMs = 0;
        this.nodeCount = 0;
        this.paragraphs = 0;
        this.characterRuns = 0;
        this.warningsCount = 0;
        this.errorsCount = 0;
        this.finalResult = 'PENDING';
        this._tiempoInicio = null;
    }

    /**
     * Retorna un resumen plano con todas las métricas acumuladas.
     * @returns {Object} Resumen de ejecución
     */
    obtenerResumen() {
        return {
            durationMs: this.durationMs,
            nodeCount: this.nodeCount,
            paragraphs: this.paragraphs,
            characterRuns: this.characterRuns,
            warningsCount: this.warningsCount,
            errorsCount: this.errorsCount,
            finalResult: this.finalResult
        };
    }

    /**
     * Acumula métricas estructurales provenientes del AST o adaptadores.
     */
    registrarMetricasAST({ nodeCount = 0, paragraphs = 0, characterRuns = 0 } = {}) {
        this.nodeCount += nodeCount;
        this.paragraphs += paragraphs;
        this.characterRuns += characterRuns;
    }

    /**
     * Incrementa el contador de advertencias periféricas.
     */
    registrarAdvertencia() {
        this.warningsCount += 1;
    }

    /**
     * Incrementa el contador de errores registrados.
     */
    registrarError() {
        this.errorsCount += 1;
    }

    /**
     * Inicia el registro del tiempo de ejecución.
     */
    iniciarCronometro() {
        this._tiempoInicio = Date.now();
    }

    /**
     * Finaliza el cronómetro y define el estado final de la ejecución.
     * @param {string} resultado - Estado final (ej. 'SUCCESS', 'ERROR')
     */
    finalizarCronometro(resultado = 'SUCCESS') {
        if (this._tiempoInicio) {
            this.durationMs = Date.now() - this._tiempoInicio;
        }
        this.finalResult = resultado;
    }
}

module.exports = {
    ColectorMetricas
};