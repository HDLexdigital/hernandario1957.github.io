/**
 * E18.2.4 — FID-01 Identity Assertion Module
 * Implementación pura de la aserción de fidelidad de identidad entre AST y DOM.
 * Cero efectos secundarios, sin acoplamiento a I/O, IPC o infraestructura E17.
 */

class FID01IdentityAssertion {
    /**
     * Ejecuta la validación de identidad FID-01 entre dos documentos canónicos.
     * @param {Object} astDoc - CanonicalDocument de origen (AST)
     * @param {Object} domDoc - CanonicalDocument de destino (DOM/XHTML)
     * @returns {Object} Resultado estructurado conforme al Diagnostic Contract
     */
    static validate(astDoc, domDoc) {
        // 1. Filtrar nodos relevantes (semantic y structural)
        const filterNodes = (nodes) => (nodes || []).filter(n => 
            n.nodeKind === 'semantic' || n.nodeKind === 'structural'
        );

        const astNodes = filterNodes(astDoc.nodes);
        const domNodes = filterNodes(domDoc.nodes);

        // SALVAGUARDA DE PRECONDICIÓN: Previene falsos PASS cuando el DOM falla en la extracción
        if (astNodes.length > 0 && domNodes.length === 0) {
            return {
                id: 'FID-01',
                status: 'NOT_DEMONSTRATED',
                severity: 'WARNING',
                category: 'STRUCTURAL',
                metrics: {
                    astIdentities: astNodes.length,
                    domIdentities: 0,
                    matched: 0,
                    missing: astNodes.length,
                    unmapped: 0,
                    duplicates: 0,
                    unstable: 0
                },
                diagnostics: [
                    {
                        code: 'DOM_EVIDENCE_EMPTY',
                        canonicalId: null,
                        message: `El documento AST contiene ${astNodes.length} nodos demostrables, pero el DOM no ha producido ningún nodo canónico extraíble. Imposible auditar fidelidad (Indicador: fallo de extracción o formato XHTML incompatible).`
                    }
                ]
            };
        }

        const diagnostics = [];
        let duplicatesCount = 0;
        let missingCount = 0;
        let unmappedCount = 0;
        let unstableCount = 0;
        let matchedCount = 0;

        // 2. Detección de duplicados en AST (Subcontrato B)
        const astIdMap = new Map();
        for (const node of astNodes) {
            if (node.identityKind === 'IDENTITY.UNSTABLE' || !node.canonicalId) {
                if (node.identityKind === 'IDENTITY.UNSTABLE') unstableCount++;
                continue;
            }
            if (astIdMap.has(node.canonicalId)) {
                duplicatesCount++;
                diagnostics.push({
                    code: 'DUPLICATE_CANONICAL_ID',
                    canonicalId: node.canonicalId,
                    message: `Identidad canónica duplicada detectada en el AST: '${node.canonicalId}'.`
                });
            } else {
                astIdMap.set(node.canonicalId, node);
            }
        }

        // 3. Detección de duplicados en DOM (Subcontrato B)
        const domIdMap = new Map();
        for (const node of domNodes) {
            if (node.identityKind === 'IDENTITY.UNSTABLE' || !node.canonicalId) {
                continue;
            }
            if (domIdMap.has(node.canonicalId)) {
                duplicatesCount++;
                diagnostics.push({
                    code: 'DUPLICATE_CANONICAL_ID',
                    canonicalId: node.canonicalId,
                    message: `Identidad canónica duplicada detectada en el DOM: '${node.canonicalId}'.`
                });
            } else {
                domIdMap.set(node.canonicalId, node);
            }
        }

        // Si hay duplicados críticos, el cruce se detiene o marca FAIL inmediato por estructura
        const hasCriticalDuplicates = diagnostics.length > 0;

        // 4. Cruce de conjuntos (Join AST <-> DOM) si no hay duplicados fatales de índice
        if (!hasCriticalDuplicates) {
            // Verificar nodos faltantes en DOM (presentes en AST)
            for (const [id, astNode] of astIdMap.entries()) {
                if (!domIdMap.has(id)) {
                    missingCount++;
                    diagnostics.push({
                        code: 'MISSING_NODE_MAPPING',
                        canonicalId: id,
                        message: `La identidad canónica '${id}' existe en el AST pero no posee representación correspondiente en el XHTML.`
                    });
                }
            }

            // Verificar nodos no mapeados en DOM (ausentes en AST)
            for (const [id, domNode] of domIdMap.entries()) {
                if (!astIdMap.has(id)) {
                    unmappedCount++;
                    diagnostics.push({
                        code: 'UNMAPPED_DOM_NODE',
                        canonicalId: id,
                        message: `La identidad canónica '${id}' existe en el DOM pero no tiene origen demostrable en el AST.`
                    });
                }
            }

            // Calcular matches exitosos
            for (const id of astIdMap.keys()) {
                if (domIdMap.has(id)) {
                    matchedCount++;
                }
            }
        }

        // 5. Determinación de Estado (PASS / FAIL / NOT_DEMONSTRATED)
        const hasErrors = diagnostics.some(d => d.code !== 'IDENTITY_UNSTABLE_NODE');
        const status = hasErrors ? 'FAIL' : (unstableCount > 0 && matchedCount === 0 ? 'NOT_DEMONSTRATED' : 'PASS');
        const severity = hasErrors ? 'ERROR' : (unstableCount > 0 ? 'WARNING' : 'INFO');

        return {
            id: 'FID-01',
            status,
            severity,
            category: 'STRUCTURAL',
            metrics: {
                astIdentities: astNodes.length,
                domIdentities: domNodes.length,
                matched: matchedCount,
                missing: missingCount,
                unmapped: unmappedCount,
                duplicates: duplicatesCount,
                unstable: unstableCount
            },
            diagnostics
        };
    }
}

module.exports = FID01IdentityAssertion;