/**
 * Adaptador periférico UxpmotorBridge (G1.1).
 * Traduce solicitudes de integración UXP al contrato operacional de la CLI (F11),
 * manteniendo un desacoplamiento absoluto mediante inyección de transporte.
 */
class UxpmotorBridge {
    constructor({ transport } = {}) {
        this.transport = transport;
    }

    /**
     * Construye la lista de argumentos planos para la CLI a partir de la solicitud.
     */
    construirArgumentos(payload = {}) {
        const args = ['compile'];

        if (payload.input) {
            args.push('--input', payload.input);
        }
        if (payload.semanticMap) {
            args.push('--semantic-map', payload.semanticMap);
        }
        if (payload.css) {
            args.push('--css', payload.css);
        }
        if (payload.output) {
            args.push('--output', payload.output);
        }
        if (payload.profile) {
            args.push('--profile', payload.profile);
        }

        return args;
    }

    /**
     * Ejecuta la solicitud a través del transporte configurado y normaliza la salida.
     */
    async ejecutar(payload = {}) {
        try {
            const args = this.construirArgumentos(payload);
            
            if (!this.transport || typeof this.transport.ejecutar !== 'function') {
                throw new Error("Transporte de ejecución no configurado o inválido en UxpmotorBridge.");
            }

            const respuesta = await this.transport.ejecutar(args);
            const exitCode = respuesta && typeof respuesta.exitCode === 'number' ? respuesta.exitCode : 1;

            return {
                success: exitCode === 0,
                exitCode,
                stdout: respuesta?.stdout || '',
                stderr: respuesta?.stderr || '',
                outputPath: exitCode === 0 ? payload.output || null : null,
                diagnostics: exitCode !== 0 ? { category: this._categorizarError(exitCode) } : null
            };
        } catch (error) {
            return {
                success: false,
                exitCode: 1, // Error operacional general
                stdout: '',
                stderr: error.message || 'Error desconocido en el puente UXP',
                outputPath: null,
                diagnostics: { category: 'TRANSPORT_ERROR' }
            };
        }
    }

    /**
     * Categoriza el error basándose en los códigos operacionales congelados de la CLI.
     */
    _categorizarError(exitCode) {
        switch (exitCode) {
            case 2: return 'INPUT_IO_ERROR';
            case 3: return 'ADAPTER_ERROR';
            case 4: return 'CORE_COMPILATION_ERROR';
            case 5: return 'VALIDATION_FAILED';
            default: return 'CLI_CONFIG_ERROR';
        }
    }
}

module.exports = {
    UxpmotorBridge
};