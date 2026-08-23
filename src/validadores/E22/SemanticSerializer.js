/**
 * E22.1 — SemanticSerializer (Motor de Proyección XHTML/EPUB3)
 * 
 * - Transforma el Árbol Derivado (E21) en una representación serializada (DOM/XHTML virtual).
 * - Utiliza estrictamente un SemanticTargetMap para resolver las etiquetas (e.g., ARTICULO -> <article>).
 * - Mapea la procedencia histórica en un namespace seguro de atributos (data-ld-*).
 * - Rechaza proyecciones si encuentra entidades semánticas no mapeadas (UNMAPPED_SEMANTIC_ENTITY).
 * - No modifica el árbol original; proyecta una estructura paralela e inmutable.
 */

'use strict';

/**
 * Aplica congelamiento profundo recursivo para garantizar inmutabilidad total.
 * @private
 */
function deepFreeze(obj) {
    if (obj && typeof obj === 'object') {
        if (!Object.isFrozen(obj)) {
            Object.freeze(obj);
        }
        Object.getOwnPropertyNames(obj).forEach(prop => {
            deepFreeze(obj[prop]);
        });
    }
    return obj;
}

class SemanticSerializer {
    /**
     * Serializa un Árbol Derivado hacia una estructura de nodos XHTML.
     * @param {Object} payload - Contenedor con derivedTree y semanticMap.
     * @returns {Object} Reporte inmutable con la proyección XHTML/DOM.
     */
    static serialize(payload) {
        if (!payload || !payload.derivedTree || !payload.semanticMap) {
            throw new Error('SEMANTIC_SERIALIZATION_VIOLATION: Se requiere un derivedTree y un semanticMap.');
        }

        const { derivedTree, semanticMap } = payload;
        const xhtmlNodes = [];

        if (Array.isArray(derivedTree.nodes)) {
            derivedTree.nodes.forEach(node => {
                xhtmlNodes.push(this._processNode(node, semanticMap));
            });
        }

        const serializedOutput = {
            metadata: {
                serializerVersion: '1.0.0',
                semanticMapVersion: semanticMap.version,
                timestamp: new Date().toISOString()
            },
            xhtmlNodes: xhtmlNodes
        };

        return deepFreeze(serializedOutput);
    }

    /**
     * Procesa recursivamente cada nodo para proyectarlo a XHTML.
     * @private
     */
    static _processNode(node, semanticMap) {
        const semanticType = node.semanticType;
        const tagName = semanticMap.mappings[semanticType];

        // 1. Prohibición de Mutación Semántica Incontrolada
        if (!tagName) {
            throw new Error(`UNMAPPED_SEMANTIC_ENTITY: Entidad semántica '${semanticType}' carece de representación en el mapa de serialización.`);
        }

        const attributes = {};

        // 2. Mapeo de Identidad
        if (node.baseDossierId) {
            attributes['id'] = node.baseDossierId;
        }

        // 3. Provenance Contract: Proyección segura (data-ld-*)
        if (node.provenance) {
            if (node.provenance.e18_Ref) attributes['data-ld-e18'] = node.provenance.e18_Ref;
            if (node.provenance.e20_5_Ref) attributes['data-ld-e20-5'] = node.provenance.e20_5_Ref;
            if (node.provenance.e20_7_Ref) attributes['data-ld-e20-7'] = node.provenance.e20_7_Ref;
        }

        if (node.ownershipEvidence && node.ownershipEvidence.rule) {
            attributes['data-ld-rule'] = node.ownershipEvidence.rule;
        }

        // 4. Preservación del texto base
        const content = (node.sourceEvidence && node.sourceEvidence.text) ? node.sourceEvidence.text : '';

        // 5. Preservación estricta de la Jerarquía Estructural
        const children = [];
        if (Array.isArray(node.children)) {
            node.children.forEach(childNode => {
                children.push(this._processNode(childNode, semanticMap));
            });
        }

        return {
            tagName,
            attributes,
            content,
            children
        };
    }
}

module.exports = SemanticSerializer;