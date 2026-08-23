'use strict';

/**
 * Compilador Lexmotor (E12) - Compilación Determinista y Segura (C.17.5)
 * Soporte completo para perfiles, mapas semánticos y tests unitarios.
 * CAPA DE PERSISTENCIA (outputFolder) EXTIRPADA. 
 * (Nota E15.6: Aún retiene lectura de fs para mapas por compatibilidad legacy).
 */

const fs = require('fs');
const { resolverTipoBase } = require('../adaptadores/TypeResolver');
const { PresentationResolver } = require('../resolucion/PresentationResolver');
const SemanticResolver = require('../adaptadores/SemanticResolver');
const { constructorXHTML } = require('../constructores/constructorXHTML');

function compilarLexmotor(ast, deps = {}) {
    if (!ast) return { ast: null, astEnriquecido: null };

    const astNormalizado = JSON.parse(JSON.stringify(ast));
    const presentationResolver = new PresentationResolver();

    let profileMap = {};
    let semanticMap = {};

    const configuracion = typeof deps === 'object' && deps !== null ? deps : {};

    // Mantenemos la lectura legacy para no romper los contratos de entrada (E12)
    if (configuracion.profileStyleMapPath) {
        try { profileMap = JSON.parse(fs.readFileSync(configuracion.profileStyleMapPath, 'utf8')); } catch (e) {}
    } else if (configuracion.profileMap && typeof configuracion.profileMap === 'object') {
        profileMap = configuracion.profileMap;
    }

    if (configuracion.semanticMapPath) {
        try {
            semanticMap = JSON.parse(fs.readFileSync(configuracion.semanticMapPath, 'utf8'));
            SemanticResolver.indexSemanticMap(semanticMap);
        } catch (e) {}
    } else if (configuracion.semanticMap && typeof configuracion.semanticMap === 'object') {
        semanticMap = configuracion.semanticMap;
        SemanticResolver.indexSemanticMap(semanticMap);
    } else {
        SemanticResolver.indexSemanticMap({});
    }

    function extraerClaseDeMapa(mapa, estilo) {
        if (!mapa || typeof mapa !== 'object') return null;
        
        const estNormal = estilo.toLowerCase();
        
        const arrayBase = Array.isArray(mapa.styles) ? mapa.styles : (Array.isArray(mapa) ? mapa : null);
        if (arrayBase) {
            const match = arrayBase.find(s => 
                (s.originalName && s.originalName.toLowerCase() === estNormal) || 
                (s.name && s.name.toLowerCase() === estNormal) ||
                (s.estilo && s.estilo.toLowerCase() === estNormal)
            );
            if (match) {
                if (match.exportTagging && match.exportTagging.epub) {
                    return match.exportTagging.epub.className || match.exportTagging.epub.class;
                }
                return match.className || match.class || match.clase || match.resolvedClass;
            }
        }

        const buscarEnDiccionario = (dic) => {
            if (!dic || typeof dic !== 'object' || Array.isArray(dic)) return null;
            const key = Object.keys(dic).find(k => k.toLowerCase() === estNormal);
            if (key) {
                const val = dic[key];
                return typeof val === 'string' ? val : (val.className || val.class || val.clase || val.resolvedClass);
            }
            return null;
        };

        let encontrado = buscarEnDiccionario(mapa);
        if (encontrado) return encontrado;

        const subDiccionarios = ['paragraphStyles', 'characterStyles', 'estilos', 'estilosParrafo', 'estilosCaracter', 'styles', 'map'];
        for (const sub of subDiccionarios) {
            encontrado = buscarEnDiccionario(mapa[sub]);
            if (encontrado) return encontrado;
        }

        return null;
    }

    function resolverParrafo(nodo) {
        if (nodo.resolvedTag && nodo.resolvedClass) return;

        const estilo = (nodo.inDesignStyle || nodo.estiloParrafo || nodo.estilo || '').trim();
        if (!estilo || estilo === '[Ninguno]') return;

        const profileClass = extraerClaseDeMapa(profileMap, estilo);
        if (profileClass) {
            nodo.resolvedClass = profileClass;
            nodo.resolvedTag = nodo.resolvedTag || 'p';
            return;
        }

        const semanticClass = extraerClaseDeMapa(semanticMap, estilo);
        if (semanticClass) {
            nodo.resolvedClass = semanticClass;
            nodo.resolvedTag = nodo.resolvedTag || 'p';
            return;
        }

        const semClass = resolverTipoBase(estilo);
        let presClass = null;
        
        try {
            presClass = presentationResolver.resolve(nodo, false);
        } catch(e) {}

        nodo.claseSemantica = nodo.claseSemantica || semClass;
        nodo.claseLegal = nodo.claseLegal || semClass;

        if (presClass) {
            nodo.resolvedClass = `${presClass} ${nodo.claseLegal}`.trim();
        } else {
            nodo.resolvedClass = nodo.claseLegal || SemanticResolver._sanitizeSelector(estilo);
        }

        nodo.resolvedTag = nodo.resolvedTag || 'p';
    }

    function resolverCaracter(nodo) {
        if (nodo.resolvedTag && nodo.resolvedClass) return;

        const estilo = (nodo.inDesignStyle || nodo.estiloCaracter || '').trim();

        if (!estilo || estilo === '[Ninguno]' || estilo === 'None') {
            if (!nodo.resolvedTag) {
                nodo.resolvedTag = null;
                nodo.resolvedClass = null;
            }
            return;
        }

        nodo.resolvedTag = nodo.resolvedTag || 'span';

        const profileClass = extraerClaseDeMapa(profileMap, estilo);
        if (profileClass) {
            nodo.resolvedClass = profileClass;
            return;
        }

        const semanticClass = extraerClaseDeMapa(semanticMap, estilo);
        if (semanticClass) {
            nodo.resolvedClass = semanticClass;
            return;
        }

        const resuelto = SemanticResolver.resolveStyleName(estilo, true, {}, {});
        nodo.resolvedClass = resuelto.resolvedClass || resuelto.class || SemanticResolver._sanitizeSelector(estilo);
    }

    function procesarNodo(nodo) {
        if (!nodo || typeof nodo !== 'object') return;

        if (nodo.tipoNodo === 'paragraph') {
            resolverParrafo(nodo);
        } else if (nodo.tipoNodo === 'character') {
            resolverCaracter(nodo);
        }

        if (Array.isArray(nodo.contenido)) {
            nodo.contenido.forEach(procesarNodo);
        }
    }

    if (Array.isArray(astNormalizado.contenido)) {
        astNormalizado.contenido.forEach(procesarNodo);
    } else if (Array.isArray(astNormalizado)) {
        astNormalizado.forEach(procesarNodo);
    } else {
        procesarNodo(astNormalizado);
    }

    let xhtml = undefined;
    if (typeof constructorXHTML === 'function') {
        xhtml = constructorXHTML(astNormalizado);
    }

    // EL BLOQUE DE ESCRITURA outputFolder QUEDA ELIMINADO PERMANENTEMENTE

    return {
        ast: astNormalizado,
        astEnriquecido: astNormalizado,
        xhtml: xhtml !== undefined ? xhtml : '<xhtml>Documento Generado</xhtml>',
        jsonOficial: true,
        metadatos: true,
        diagnostico: {}
    };
}

module.exports = { compilarLexmotor };