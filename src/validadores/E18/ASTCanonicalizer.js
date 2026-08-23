/**
 * E18.2.2 — ASTCanonicalizer (Versión Definitiva: Identidad Desacoplada y Normativa)
 * Proyección pura, inmutable y estrictamente desacoplada del AST editorial 
 * hacia el contrato CanonicalRepresentation (E18.2.1), consumiendo el SemanticTypeResolver.
 */

'use strict';

const crypto = require('crypto');
const SemanticTypeResolver = require('./SemanticTypeResolver');

class ASTCanonicalizer {
    /**
     * Proyecta un AST completo hacia un CanonicalDocument canónico.
     * Garantiza inmutabilidad, semántica normativa, propagación del último ancestro identificado y cero identidad sintética.
     * 
     * @param {Object} astRoot - Nodo raíz del AST obtenido de adaptarInDesign()
     * @returns {Object} CanonicalDocument estructurado
     */
    static canonicalize(astRoot) {
        if (!astRoot) {
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
         * Proyección recursiva del árbol AST
         * @param {Object} node - Nodo actual
         * @param {string|null} lastExplicitAncestorId - ID canónico del último ancestro con identidad explícita
         */
        function walk(node, lastExplicitAncestorId = null) {
            if (!node || typeof node !== 'object') return;

            globalOrder++;

            // 1. Construcción de evidencia local estricta para el SemanticTypeResolver
            const localEvidence = {
                sourceType: 'AST',
                estiloParrafo: node.estiloParrafo || node.inDesignStyle || null,
                tipo: node.tipo || null,
                tipoNodo: node.tipoNodo || null
            };

            // 2. Delegación normativa al SemanticTypeResolver (Cero heurísticas locales)
            const resolution = SemanticTypeResolver.resolve(localEvidence);

            const semanticType = resolution.semanticType;
            const nodeKind = resolution.nodeKind;
            const confidence = resolution.confidence;
            const resolvedRuleId = resolution.evidence.ruleId;

            // 3. Resolución de Identidad Institucional Estricta (P-01)
            let canonicalId = null;
            let identityKind = 'IDENTITY.UNSTABLE';

            if (node.idJuridico) {
                const token = node.idJuridico;
                canonicalId = lastExplicitAncestorId ? `${lastExplicitAncestorId}.${token}` : `document.${token}`;
                identityKind = 'IDENTITY.EXPLICIT';
            } else {
                canonicalId = null;
                identityKind = 'IDENTITY.UNSTABLE';
            }

            // 4. Extracción y Normalización de Texto
            const rawText = node.texto || node.content || (typeof node === 'string' ? node : '');
            const normalizedText = normalizeText(rawText);

            // 5. Huella de Contenido (Puramente textual, independiente de identidad y semántica)
            const contentFingerprint = computeFingerprint(normalizedText);

            // 6. Estilo Canónico (styleKey)
            const styleKey = node.inDesignStyle || node.estiloParrafo || node.estiloCaracter || null;

            // 7. Construcción del Nodo Canónico
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
                    sourceType: 'AST',
                    confidence,
                    ruleId: resolvedRuleId,
                    rawToken: localEvidence.estiloParrafo,
                    originalTypeNodo: node.tipoNodo || null
                }
            };

            nodes.push(canonicalNode);

            // 8. Determinación del contexto para los hijos
            const nextAncestorId = canonicalId || lastExplicitAncestorId;

            // 9. Recorrido recursivo de hijos (contenido)
            const children = node.contenido || node.children || node.hijos;
            if (Array.isArray(children)) {
                children.forEach(child => walk(child, nextAncestorId));
            }
        }

        walk(astRoot, null);

        return {
            version: '1.0.0',
            nodes
        };
    }
}

module.exports = ASTCanonicalizer;