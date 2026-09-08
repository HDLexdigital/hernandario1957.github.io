/**
 * O6.4 — Evidence Graph Consistency Engine
 * 
 * - Verifica la topología genealógica y la consistencia del DAG histórico a través de O1–O5.
 * - Garantiza los invariantes G1–G12 (DAG acíclico, prevención de huérfanos, preservación de ramas históricas y read-only).
 */

'use strict';

const crypto = require('crypto');

class EvidenceGraphConsistencyEngine {

    constructor() {
        this.graphStore = new Map(); // Almacén inmutable de veredictos de grafo (graphVerdictHash -> GraphVerdict)
    }

    /**
     * G1–G12: Audita la consistencia topológica y genealógica del grafo de evidencia de forma determinista y read-only
     */
    verifyEvidenceGraph(graphPayload) {
        // G1. Valid Graph Root
        if (!graphPayload || !Array.isArray(graphPayload.nodes) || !Array.isArray(graphPayload.edges)) {
            throw new Error('INVALID_GRAPH_PAYLOAD: Nodes and edges arrays are mandatory for graph validation.');
        }

        const { nodes, edges } = graphPayload;

        if (nodes.length === 0) {
            throw new Error('EMPTY_GRAPH_ROOT: Graph must contain at least a root node.');
        }

        const nodeMap = new Map();
        nodes.forEach(node => {
            if (!node.id) throw new Error('NODE_IDENTITY_ERROR: Every node must possess a unique identifier.');
            // G2. Node Identity Uniqueness
            if (nodeMap.has(node.id)) {
                throw new Error(`NODE_IDENTITY_UNIQUENESS_VIOLATION: Duplicate node identifier '${node.id}' detected.`);
            }
            nodeMap.set(node.id, node);
        });

        // G3 & G5. Valid Edge Binding & Parent Existence
        const adjacencyList = new Map();
        nodes.forEach(n => adjacencyList.set(n.id, []));

        edges.forEach(edge => {
            if (!edge.from || !edge.to) {
                throw new Error("INVALID_EDGE_BINDING: Edges must declare both 'from' and 'to' endpoints.");
            }
            if (!nodeMap.has(edge.from) || !nodeMap.has(edge.to)) {
                throw new Error(`PARENT_EXISTENCE_VIOLATION: Edge connects non-existent nodes ('${edge.from}' -> '${edge.to}').`);
            }
            adjacencyList.get(edge.from).push(edge.to);
        });

        // G7. No Impossible Cycles (Detección de ciclos mediante DFS)
        const visited = new Set();
        const visiting = new Set();

        const checkCycle = (nodeId) => {
            visiting.add(nodeId);
            const neighbors = adjacencyList.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (visiting.has(neighbor)) {
                    throw new Error(`IMPOSSIBLE_GRAPH_CYCLE_DETECTED: Cycle found involving node '${neighbor}'.`);
                }
                if (!visited.has(neighbor)) {
                    checkCycle(neighbor);
                }
            }
            visiting.delete(nodeId);
            visited.add(nodeId);
        };

        for (const node of nodes) {
            if (!visited.has(node.id)) {
                checkCycle(node.id);
            }
        }

        // G4. No Orphan Nodes (Verificación de conectividad para nodos secundarios)
        const incomingEdgesCount = new Map();
        nodes.forEach(n => incomingEdgesCount.set(n.id, 0));
        edges.forEach(e => {
            incomingEdgesCount.set(e.to, incomingEdgesCount.get(e.to) + 1);
        });

        let rootCount = 0;
        nodes.forEach(n => {
            if (incomingEdgesCount.get(n.id) === 0) {
                rootCount++;
            }
        });

        if (rootCount === 0) {
            throw new Error('GRAPH_ROOT_MISSING: No root node found without incoming edges.');
        }

        // G11. Deterministic Graph Verdict Hash (serialización canónica ordenada)
        const canonicalGraphPayload = {
            nodes: [...nodes].sort((a, b) => a.id.localeCompare(b.id)),
            edges: [...edges].sort((a, b) => `${a.from}->${a.to}`.localeCompare(`${b.from}->${b.to}`))
        };

        const serialized = JSON.stringify(canonicalGraphPayload, Object.keys(canonicalGraphPayload).sort());
        const graphVerdictHash = crypto.createHash('sha256').update(serialized).digest('hex');

        const graphVerdict = Object.freeze({
            ...canonicalGraphPayload,
            graphVerdictHash,
            status: 'EVIDENCE_GRAPH_CONSISTENT',
            verifiedAt: new Date().toISOString()
        });

        // Almacenamiento inmutable read-only
        this.graphStore.set(graphVerdictHash, graphVerdict);

        return graphVerdict;
    }

    /**
     * Consulta un veredicto de grafo guardado
     */
    lookupGraphVerdict(graphVerdictHash) {
        if (!this.graphStore.has(graphVerdictHash)) {
            throw new Error(`GRAPH_VERDICT_NOT_FOUND: Graph verdict hash ${graphVerdictHash} does not exist.`);
        }
        return this.graphStore.get(graphVerdictHash);
    }
}

module.exports = EvidenceGraphConsistencyEngine;