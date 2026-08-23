/**
 * E18.2.3.3 — DOMCanonicalizer (Versión Normativa e Integrada con SemanticTypeResolver)
 * Proyección pura, inmutable y estrictamente desacoplada del XHTML editorial 
 * hacia el contrato CanonicalRepresentation (E18.2.1), consumiendo el SemanticTypeResolver.
 * Alineado con la evidencia empírica de E18.2.3.4 (cero identidad institucional nativa en DOM).
 */

'use strict';

const crypto = require('crypto');
const SemanticTypeResolver = require('./SemanticTypeResolver');

class DOMCanonicalizer {
    /**
     * Proyecta un árbol DOM/XHTML completo hacia un CanonicalDocument canónico.
     * Garantiza inmutabilidad, semántica normativa delegada, propagación del ancestro y cero identidad sintética.
     * 
     * @param {Object} domRoot - Nodo raíz del árbol XHTML obtenido del parser
     * @returns {Object} CanonicalDocument estructurado
     */
    static canonicalize(domRoot) {
        if (!domRoot) {
            return { version: '1.0.0', nodes: [] };
        }

        const nodes = [];
        let globalOrder = 0;

        /**
         * Función auxiliar para generar un fingerprint de contenido puramente textual (P-03)
         */
        function computeFingerprint(normalizedText) {
            const hash = crypto.createHash('sha256');
            hash.update(normalizedText);
            return `sha256:${hash.digest('hex').substring(0, 16)}`;
        }

        /**
         * Normalización de texto contractual (P-03)
         */
        function normalizeText(text) {
            if (typeof text !== 'string') return '';
            return text.replace(/\s+/g, ' ').trim();
        }

        /**
         * Proyección recursiva del árbol DOM
         * @param {Object} node - Nodo actual del DOM
         * @param {string|null} lastExplicitAncestorId - ID canónico del último ancestro con identidad explícita
         */
        function walk(node, lastExplicitAncestorId = null) {
            if (!node || typeof node !== 'object') return;

            globalOrder++;

            // 1. Extracción de clases CSS de la evidencia XHTML
            let rawClasses = [];
            if (Array.isArray(node.classes)) {
                rawClasses = node.classes;
            } else if (typeof node.classes === 'string') {
                rawClasses = node.classes.split(/\s+/).filter(Boolean);
            } else if (typeof node.className === 'string') {
                rawClasses = node.className.split(/\s+/).filter(Boolean);
            }

            // 2. Construcción de evidencia local estricta para el SemanticTypeResolver
            const localEvidence = {
                sourceType: 'XHTML',
                classes: rawClasses
            };

            // 3. Delegación normativa al SemanticTypeResolver (Cero heurísticas semánticas propias)
            const resolution = SemanticTypeResolver.resolve(localEvidence);

            const semanticType = resolution.semanticType;
            const nodeKind = resolution.nodeKind;
            const confidence = resolution.confidence;
            const resolvedRuleId = resolution.evidence.ruleId;

            // 4. Resolución de Identidad Institucional Estricta (P-01)
            // Empíricamente demostrado (E18.2.3.4): El XHTML real no emite atributos institucionales.
            // Ningún atributo técnico ni data-* confiere identidad por defecto en el DOM.
            const canonicalId = null;
            const identityKind = 'IDENTITY.UNSTABLE';

            // 5. Extracción y Normalización de Texto
            const rawText = node.texto || node.content || node.text || (typeof node === 'string' ? node : '');
            const normalizedText = normalizeText(rawText);

            // 6. Huella de Contenido (Puramente textual, independiente de identidad y semántica)
            const contentFingerprint = computeFingerprint(normalizedText);

            // 7. Estilo Canónico (styleKey a partir de la primera clase o class string)
            const styleKey = rawClasses.length > 0 ? rawClasses[0] : (node.className || null);

            // 8. Construcción del Nodo Canónico
            const canonicalNode = {
                canonicalId,
                identityKind,
                nodeKind,
                semanticType,
                order: globalOrder,
                parentCanonicalId: lastExplicitAncestorId,
                styleKey,
                normalizedText,
                contentFingerprint,
                evidence: {
                    sourceType: 'XHTML',
                    confidence,
                    ruleId: resolvedRuleId,
                    rawToken: rawClasses.join(' ') || null,
                    originalTypeNodo: node.tag || node.type || null
                }
            };

            nodes.push(canonicalNode);

            // 9. Determinación del contexto para los hijos (nearestExplicitCanonicalId)
            const nextAncestorId = canonicalId || lastExplicitAncestorId;

            // 10. Recorrido recursivo de hijos (contenido)
            const children = node.contenido || node.children || node.hijos;
            if (Array.isArray(children)) {
                children.forEach(child => walk(child, nextAncestorId));
            }
        }

        walk(domRoot, null);

        return {
            version: '1.0.0',
            nodes
        };
    }
}

module.exports = DOMCanonicalizer;