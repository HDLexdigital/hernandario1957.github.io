/**
 * E23.3.5.1 — PhysicalProjector (Proyector Físico y Generador de Ledger)
 * 
 * - Valida la obligatoriedad de entornos aislados (sandbox) para la proyección.
 * - Verifica la integridad y versión del plan de proyección certificado (E23.3.2).
 * - Traduce nodos lógicos en operaciones primitivas atómicas preservando la identidad (ID).
 * - Emite el Projection Ledger auditando cada operación sin alterar los datos fuente.
 */

'use strict';

class PhysicalProjector {
    /**
     * Simula o ejecuta la validación de sandbox para la proyección física.
     * @param {Object} plan - Plan de proyección certificado.
     * @param {Object} options - Opciones de ejecución ({ sandboxPath }).
     */
    static projectToEnvironment(plan, options = {}) {
        if (!options || !options.sandboxPath || typeof options.sandboxPath !== 'string' || options.sandboxPath.trim() === '') {
            throw new Error('PHYSICAL_PROJECTION_VIOLATION: Se requiere especificar un sandboxPath válido para la proyección física.');
        }

        this._validatePlan(plan);
        return { status: 'SANDBOX_VALIDATED', target: options.sandboxPath };
    }

    /**
     * Valida la estructura y versión del plan certificado.
     * @private
     */
    static _validatePlan(plan) {
        if (!plan || plan.projectionVersion !== 'E23.3.2' || !Array.isArray(plan.nodes)) {
            throw new Error('PHYSICAL_PROJECTION_VIOLATION: Versión (version) o estructura del plan de proyección inválida.');
        }
    }

    /**
     * Traduce el plan de proyección en una secuencia plana de operaciones primitivas atómicas.
     * @param {Object} plan - Plan certificado.
     * @returns {Array<Object>} Secuencia de operaciones primitivas.
     */
    static buildPrimitiveOperations(plan) {
        this._validatePlan(plan);

        const operations = [];

        const traverse = (node) => {
            operations.push({
                operation: 'CREATE_PARAGRAPH',
                logicalId: node.id,
                domainType: node.domainType,
                content: node.content,
                paragraphStyle: node.projection.paragraphStyle,
                exportTag: node.projection.exportTag
            });

            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(child => traverse(child));
            }
        };

        plan.nodes.forEach(node => traverse(node));
        return operations;
    }

    /**
     * Simula el despacho en sandbox emitiendo el Projection Ledger de auditoría.
     * @param {Object} plan - Plan certificado.
     * @param {string} sandboxPath - Ruta del entorno aislado.
     * @returns {Object} Resultado con el ledger de operaciones.
     */
    static simulateSandboxDispatch(plan, sandboxPath) {
        this.projectToEnvironment(plan, { sandboxPath });
        const primitives = this.buildPrimitiveOperations(plan);

        const ledgerEntries = primitives.map((prim, index) => ({
            sequence: index + 1,
            operation: prim.operation,
            sourceNodeId: prim.logicalId,
            targetStyle: prim.paragraphStyle,
            exportTag: prim.exportTag,
            result: 'SUCCESS'
        }));

        return {
            sandboxPath: sandboxPath,
            ledgerEntries: ledgerEntries
        };
    }
}

module.exports = PhysicalProjector;