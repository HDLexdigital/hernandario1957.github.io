'use strict';

const ErrorModulo = require('../errors/PresentationResolutionError');
const PresentationResolutionError = ErrorModulo.PresentationResolutionError || ErrorModulo;
const semanticMapRaw = require('../assets/style-model.json');
const { indexSemanticMap, _sanitizeSelector } = require('../adaptadores/SemanticResolver');

class PresentationResolver {
    constructor() {
        this.map = indexSemanticMap(semanticMapRaw);
    }

    resolve(nodo, strict = false) {
        if (!nodo || (!nodo.estiloParrafo && !nodo.inDesignStyle && !nodo.clase && !nodo.estiloCaracter)) {
            if (strict) throw new PresentationResolutionError('Nodo sin estilo de origen');
            return null;
        }

        const estiloOrigen = nodo.estiloParrafo || nodo.inDesignStyle || nodo.estiloCaracter || nodo.clase;
        
        let claseResuelta = null;
        
        // Si el mapa lo conoce, extraemos su clase limpia (la regla semántica base)
        if (this.map[estiloOrigen]) {
            claseResuelta = _sanitizeSelector(estiloOrigen);
        }

        if (!claseResuelta) {
            if (strict) throw new PresentationResolutionError(`Estilo desconocido: ${estiloOrigen}`);
            return null;
        }

        return claseResuelta;
    }
}

module.exports = { PresentationResolver };