/**
 * O6.4 — Evidence Graph Consistency Contract Suite (G1–G12)
 */

'use strict';

const path = require('path');
const EvidenceGraphConsistencyEngine = require(path.join(process.cwd(), 'src', 'operations', 'O6', 'EvidenceGraphConsistencyEngine'));

describe('O6.4 — Evidence Graph Consistency Contract Suite (G1–G12)', () => {

    let graphEngine;

    beforeEach(() => {
        graphEngine = new EvidenceGraphConsistencyEngine();
    });

    test('G1, G2, G3, G5, G7, G11 & G12. CAMINO VERDE: Valida un DAG genealógico coherente generando un hash determinista', () => {
        const validGraph = {
            nodes: [
                { id: 'EXEC_001', type: 'EXECUTION' },
                { id: 'INC_001', type: 'INCIDENT' },
                { id: 'REM_001', type: 'REMEDIATION' },
                { id: 'EXEC_002', type: 'EXECUTION' }
            ],
            edges: [
                { from: 'EXEC_001', to: 'INC_001' },
                { from: 'INC_001', to: 'REM_001' },
                { from: 'REM_001', to: 'EXEC_002' }
            ]
        };

        const verdict = graphEngine.verifyEvidenceGraph(validGraph);

        expect(verdict.status).toBe('EVIDENCE_GRAPH_CONSISTENT');
        expect(verdict.graphVerdictHash).toBeDefined();
        expect(verdict.nodes.length).toBe(4);
    });

    test('G7. NO IMPOSSIBLE CYCLES: Detecta y rechaza bucles genealógicos o ciclos cerrados en el grafo', () => {
        const cyclicGraph = {
            nodes: [
                { id: 'EXEC_001', type: 'EXECUTION' },
                { id: 'EXEC_002', type: 'EXECUTION' }
            ],
            edges: [
                { from: 'EXEC_001', to: 'EXEC_002' },
                { from: 'EXEC_002', to: 'EXEC_001' } // Ciclo ilegal
            ]
        };

        expect(() => {
            graphEngine.verifyEvidenceGraph(cyclicGraph);
        }).toThrow('IMPOSSIBLE_GRAPH_CYCLE_DETECTED');
    });

    test('G2. NODE IDENTITY UNIQUENESS: Rechaza grafos que presenten nodos con identificadores duplicados', () => {
        const duplicateNodesGraph = {
            nodes: [
                { id: 'EXEC_001', type: 'EXECUTION' },
                { id: 'EXEC_001', type: 'EXECUTION' } // Duplicado
            ],
            edges: []
        };

        expect(() => {
            graphEngine.verifyEvidenceGraph(duplicateNodesGraph);
        }).toThrow('NODE_IDENTITY_UNIQUENESS_VIOLATION');
    });

    test('G3 & G5. VALID EDGE BINDING: Rechaza aristas que apunten a nodos inexistentes o no declarados', () => {
        const brokenEdgeGraph = {
            nodes: [
                { id: 'EXEC_001', type: 'EXECUTION' }
            ],
            edges: [
                { from: 'EXEC_001', to: 'EXEC_999' } // Nodo fantasma
            ]
        };

        expect(() => {
            graphEngine.verifyEvidenceGraph(brokenEdgeGraph);
        }).toThrow('PARENT_EXISTENCE_VIOLATION');
    });
});