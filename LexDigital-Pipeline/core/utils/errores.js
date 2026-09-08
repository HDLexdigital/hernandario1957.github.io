class PipelineError extends Error {
    constructor(mensaje, contexto = {}) {
        super(mensaje);
        this.nombre = 'PipelineError';
        this.contexto = contexto;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            nombre: this.nombre,
            mensaje: this.message,
            contexto: this.contexto,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }

    toString() {
        return `${this.nombre}: ${this.message} (${JSON.stringify(this.contexto)})`;
    }
}

class ValidationError extends PipelineError {
    constructor(mensaje, contexto = {}) {
        super(mensaje, contexto);
        this.nombre = 'ValidationError';
    }
}

class ConfigurationError extends PipelineError {
    constructor(mensaje, contexto = {}) {
        super(mensaje, contexto);
        this.nombre = 'ConfigurationError';
    }
}

class TimeoutError extends PipelineError {
    constructor(mensaje, contexto = {}) {
        super(mensaje, contexto);
        this.nombre = 'TimeoutError';
    }
}

module.exports = {
    PipelineError,
    ValidationError,
    ConfigurationError,
    TimeoutError
};