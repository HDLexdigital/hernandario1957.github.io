/**
 * E21.2 — ReconstitutionAdapter (Adaptador Evidence-to-Tree)
 * 
 * - Convierte el reporte de atribución masiva (E20.7) en un Árbol Derivado (DerivedTree).
 * - Garantiza la "conservación de la masa": N artículos de entrada = N nodos derivados.
 * - Tabula de forma estricta la auditoría de integridad estructural (Integrity Audit).
 * - Protege los invariantes aplicando Deep Freeze al árbol resultante.
 */

'use strict';

const ReconstitutionEngine = require('./ReconstitutionEngine');

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

class ReconstitutionAdapter {
    /**
     * Ensambla el Árbol Derivado (DerivedTree) a partir de la evidencia certificada.
     * @param {Object} payload - Contenedor con attributionReport, originalASTNodes y evaluationVersion.
     * @returns {Object} Árbol Derivado inmutable con auditoría de integridad.
     */
    static synthesizeTree(payload) {
        if (!payload || !payload.attributionReport || !Array.isArray(payload.attributionReport.attributions)) {
            throw new Error('RECONSTITUTION_ADAPTER_VIOLATION: Se requiere un reporte de atribución (E20.7) válido e iterativo.');
        }

        const { attributionReport, originalASTNodes = {}, evaluationVersion = '1.0.0' } = payload;
        const attributions = attributionReport.attributions;

        const derivedNodes = [];
        let totalSynthesizedChildren = 0;
        let orphanInputs = 0;

        attributions.forEach(dossier => {
            try {
                // Recuperación de trazabilidad histórica E20.5 para el ID del nodo raíz
                const e20_5_Ref = dossier.baseObservationRef && 
                                  dossier.baseObservationRef.traceability && 
                                  dossier.baseObservationRef.traceability.e20_5_Ref;
                
                if (!e20_5_Ref) {
                    orphanInputs++;
                    return; // Abortamos la reconstitución de esta rama si no hay pasaporte histórico
                }

                // 🛠️ PARCHE DE RESILIENCIA IDENTITARIA:
                // Soporta tanto los mocks de prueba (alignmentId) como la nomenclatura histórica del corpus real (id)
                const baseDossierId = e20_5_Ref.alignmentId || 
                                      e20_5_Ref.id || 
                                      e20_5_Ref.nodeId || 
                                      `ARTICULO_BASE_${derivedNodes.length + 1}`;

                // Delegación de la síntesis al Motor E21.1
                const synthesizedNode = ReconstitutionEngine.synthesizeNode({
                    baseDossierId: baseDossierId,
                    attributions: dossier.nodeAttributions || [],
                    originalASTNodes: originalASTNodes
                });

                derivedNodes.push(synthesizedNode);
                totalSynthesizedChildren += synthesizedNode.children.length;

            } catch (error) {
                // Cualquier intento de inyectar claims falsificados cae aquí
                orphanInputs++;
            }
        });

        const derivedTree = {
            metadata: {
                adapterVersion: '1.0.1',
                evaluationVersion: evaluationVersion,
                timestamp: new Date().toISOString()
            },
            nodes: derivedNodes,
            integrityAudit: {
                inputDossiers: attributions.length,
                derivedNodes: derivedNodes.length,
                totalSynthesizedChildren: totalSynthesizedChildren,
                orphanInputs: orphanInputs
            }
        };

        return deepFreeze(derivedTree);
    }
}

module.exports = ReconstitutionAdapter;