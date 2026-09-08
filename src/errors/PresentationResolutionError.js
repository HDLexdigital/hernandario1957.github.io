'use strict';

class PresentationResolutionError extends Error {
    constructor(mensaje) {
        super(mensaje);
        this.name = 'PresentationResolutionError';
    }
}

module.exports = { PresentationResolutionError };