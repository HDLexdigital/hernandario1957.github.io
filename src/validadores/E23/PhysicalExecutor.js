/**
 * E23.3.5.2 — PhysicalExecutor (Ejecutor Físico UXP)
 * 
 * - Compila planes certificados en operaciones primitivas atómicas (CREATE_PARAGRAPH, PLACE_CHILD).
 * - Aplica la política transaccional estricta NO_PARTIAL_COMMIT validando la integridad previa.
 * - Separa el Ledger Lógico determinista (hashable) de los Runtime Metadata (timestamps y sesiones).
 * - Garantiza cero inferencia semántica y absoluta inmutabilidad de entrada.
 */

'use strict';

class PhysicalExecutor {
    /**
     * Valida la integridad del plan antes de compilar o ejecutar.
     * @private
     */
    static _validatePlanIntegrity(plan) {
        if (!plan || plan.projectionVersion !== 'E23.3.2' || !Array.isArray(plan.nodes)) {
            throw new Error('PHYSICAL_EXECUTION_VIOLATION: Plan de proyección inválido o versión incompatible.');
        }

        const validateNode = (node) => {
            if (!node.id || node.id === 'unknown-id') {
                throw new Error(`PHYSICAL_EXECUTION_VIOLATION: ID de nodo no válido detectado ('${node.id}').`);
            }
            if (!node.projection || !node.projection.paragraphStyle || !node.projection.exportTag) {
                throw new Error(`PHYSICAL_EXECUTION_VIOLATION: NO_PARTIAL_COMMIT - El nodo '${node.id}' carece de metadatos de estilo o exportTag obligatorios.`);
            }
            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(child => validateNode(child));
            }
        };

        plan.nodes.forEach(node => validateNode(node));
    }

    /**
     * Compila el plan en una secuencia determinista de operaciones primitivas atómicas.
     * @param {Object} plan - Plan de proyección certificado.
     * @returns {Object} Conjunto estructurado de primitivas.
     */
    static compilePrimitives(plan) {
        this._validatePlanIntegrity(plan);

        const primitives = [];

        const traverse = (node, parentId = null) => {
            const opType = parentId ? 'PLACE_CHILD' : 'CREATE_PARAGRAPH';

            primitives.push({
                operation: opType,
                logicalId: node.id,
                parentId: parentId,
                domainType: node.domainType,
                content: node.content,
                paragraphStyle: node.projection.paragraphStyle,
                exportTag: node.projection.exportTag
            });

            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(child => traverse(child, node.id));
            }
        };

        plan.nodes.forEach(node => traverse(node, null));

        return {
            compilerVersion: 'E23.3.5.2',
            primitives: primitives
        };
    }

    /**
     * Ejecuta el despacho simulado en sandbox aplicando aislamiento de ledgers y política transaccional.
     * @param {Object} plan - Plan certificado.
     * @param {Object} options - Opciones ({ sandboxPath }).
     * @returns {Object} Resultado con Ledger Lógico y Runtime Metadata.
     */
    static executeSandbox(plan, options = {}) {
        if (!options || !options.sandboxPath || typeof options.sandboxPath !== 'string') {
            throw new Error('PHYSICAL_EXECUTION_VIOLATION: Se requiere un sandboxPath válido para el despacho físico.');
        }

        // Transaccionalidad total: validación previa obligatoria (No Partial Commit)
        this._validatePlanIntegrity(plan);

        const compiled = this.compilePrimitives(plan);

        // Construcción del Ledger Lógico (Puramente determinista, sin timestamps ni entropía temporal)
        const logicalEntries = compiled.primitives.map((prim, index) => ({
            sequence: index + 1,
            nodeId: prim.logicalId,
            parentId: prim.parentId,
            operation: prim.operation,
            domainType: prim.domainType,
            paragraphStyle: prim.paragraphStyle,
            exportTag: prim.exportTag,
            status: 'DISPATCH_READY'
        }));

        const logicalLedger = {
            ledgerVersion: 'E23.3.5.2-LOGICAL',
            entries: logicalEntries
        };

        // Construcción de los Metadatos de Ejecución (Runtime / No hashable)
        const runtimeMetadata = {
            sessionId: `UXP_SESS_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            sandboxPath: options.sandboxPath,
            timestamp: new Date().toISOString(),
            totalDispatched: logicalEntries.length
        };

        return {
            status: 'EXECUTION_SUCCESS',
            logicalLedger: logicalLedger,
            runtimeMetadata: runtimeMetadata
        };
    }
}

module.exports = PhysicalExecutor;