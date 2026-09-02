'use strict';
const crypto = require('crypto');
class ContratoIngesta {
    constructor() {
        this.errores = [];
        this.advertencias = [];
    }
    validarCorpus(corpus, metadatos = {}) {
        this.errores = [];
        this.advertencias = [];
        if (!corpus || typeof corpus !== 'object') {
            this.errores.push('Corpus vacío o inválido');
        }
        const inputHash = this.generarInputHash(corpus);
        return {
            valido: this.errores.length === 0,
            errores: this.errores,
            advertencias: this.advertencias,
            inputHash: inputHash,
            corpusId: metadatos.corpusId || null,
            version: metadatos.version || null
        };
    }
    generarInputHash(corpus) {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(corpus))
            .digest('hex');
    }
}
module.exports = ContratoIngesta;