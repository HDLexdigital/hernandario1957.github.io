/**
 * Controlador del Panel UXP (G1.2).
 * Orquesta la interfaz de usuario, gestiona el estado de compilación
 * y valida los contratos del manifiesto sin acoplarse al núcleo ni al transporte real.
 */
class UxpPanelController {
    constructor({ bridge } = {}) {
        this.bridge = bridge;
        this.state = {
            status: 'IDLE',
            isCompiling: false,
            lastResult: null,
            lastDiagnostics: null
        };
    }

    /**
     * Retorna una copia del estado actual del panel.
     */
    obtenerEstado() {
        return { ...this.state };
    }

    /**
     * Orquesta la ejecución de la compilación utilizando el bridge inyectado.
     */
    async ejecutarCompilacion(payload = {}) {
        this.state.isCompiling = true;
        this.state.status = 'COMPILING';
        this.state.lastDiagnostics = null;

        try {
            if (!this.bridge || typeof this.bridge.ejecutar !== 'function') {
                throw new Error("Bridge de transporte no configurado en UxpPanelController.");
            }

            const resultado = await this.bridge.ejecutar(payload);
            
            this.state.lastResult = resultado;
            this.state.isCompiling = false;

            if (resultado.success) {
                this.state.status = 'SUCCESS';
            } else {
                this.state.status = 'ERROR';
                this.state.lastDiagnostics = resultado.diagnostics || { category: 'UNKNOWN_ERROR' };
            }

            return resultado;
        } catch (error) {
            this.state.isCompiling = false;
            this.state.status = 'ERROR';
            const errorResult = {
                success: false,
                exitCode: 1,
                stdout: '',
                stderr: error.message || 'Error desconocido en el controlador UXP',
                outputPath: null,
                diagnostics: { category: 'CONTROLLER_ERROR' }
            };
            this.state.lastResult = errorResult;
            this.state.lastDiagnostics = errorResult.diagnostics;
            return errorResult;
        }
    }

    /**
     * Valida la estructura mínima requerida para el manifest.json de UXP en InDesign.
     */
    static validarManifest(manifest = {}) {
        const missingFields = [];

        if (!manifest.manifestVersion) missingFields.push('manifestVersion');
        if (!manifest.id) missingFields.push('id');
        if (!manifest.name) missingFields.push('name');
        if (!manifest.version) missingFields.push('version');
        if (!manifest.main) missingFields.push('main');
        
        const hostValido = Array.isArray(manifest.host) && manifest.host.some(h => h.app === 'indesign');
        if (!hostValido) missingFields.push('host (indesign)');

        return {
            valid: missingFields.length === 0,
            missingFields
        };
    }
}

module.exports = {
    UxpPanelController
};