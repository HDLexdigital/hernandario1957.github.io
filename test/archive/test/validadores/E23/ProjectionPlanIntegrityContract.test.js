/**
 * E23.3.2 — Projection Plan Integrity Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Integridad del Plan de Proyección:
 * - Prohíbe terminantemente la existencia de nodos con id 'unknown-id'.
 * - Exige la preservación del contenido textual original proveniente del AST.
 * - Garantiza la unicidad absoluta de todos los identificadores en todo el árbol de proyección (raíces e hijos).
 * - Valida la obligatoriedad estricta de las propiedades editoriales (paragraphStyle, exportTag).
 * - Asegura que el AST de entrada no sufra mutaciones.
 */

'use strict';

// El adaptador aún no implementa las salvaguardas estrictas de integridad (Fase RED esperada)
const ProjectionAdapter = require('../../../src/validadores/E23/ProjectionAdapter');

describe('E23.3.2 — Projection Plan Integrity Contract (Fase RED)', () => {

    const mockCertifiedAST = Object.freeze({
        version: 'E21.0.0',
        nodes: [
            {
                baseDossierId: 'ARTICULO_1',
                semanticType: 'ARTICULO',
                content: 'Texto base del artículo 1',
                children: [
                    {
                        baseDossierId: 'NUMERAL_1_1',
                        semanticType: 'NUMERAL',
                        content: 'Texto del numeral subordinado 1.1'
                    }
                ]
            }
        ]
    });

    const mappingRules = Object.freeze({
        'ARTICULO': { paragraphStyle: 'LD_Articulo', exportTag: 'article' },
        'NUMERAL': { paragraphStyle: 'LD_Numeral', exportTag: 'div' }
    });

    test('1. NO UNKNOWN IDs: Ningún nodo (raíz ni hijo) puede tener el identificador "unknown-id"', () => {
        const plan = ProjectionAdapter.generatePlan(mockCertifiedAST, mappingRules);
        
        const root = plan.nodes[0];
        const child = root.children[0];

        expect(root.id).not.toBe('unknown-id');
        expect(root.id).toBe('ARTICULO_1');
        
        expect(child.id).not.toBe('unknown-id');
        expect(child.id).toBe('NUMERAL_1_1');
    });

    test('2. CONTENT PRESERVATION: Los nodos proyectados deben retener el contenido textual del AST original', () => {
        const plan = ProjectionAdapter.generatePlan(mockCertifiedAST, mappingRules);
        
        const root = plan.nodes[0];
        const child = root.children[0];

        expect(root.content).toBe('Texto base del artículo 1');
        expect(child.content).toBe('Texto del numeral subordinado 1.1');
    });

    test('3. UNIQUE IDENTIFIERS: Todos los IDs del plan de proyección deben ser estrictamente únicos', () => {
        const plan = ProjectionAdapter.generatePlan(mockCertifiedAST, mappingRules);
        
        const allIds = [];
        plan.nodes.forEach(node => {
            allIds.push(node.id);
            if (node.children) {
                node.children.forEach(child => allIds.push(child.id));
            }
        });

        const uniqueIds = new Set(allIds);
        expect(uniqueIds.size).toBe(allIds.length);
    });

    test('4. MANDATORY METADATA: Cada nodo proyectado debe poseer paragraphStyle y exportTag válidos', () => {
        const plan = ProjectionAdapter.generatePlan(mockCertifiedAST, mappingRules);
        
        const root = plan.nodes[0];
        const child = root.children[0];

        expect(root.projection.paragraphStyle).toBeDefined();
        expect(root.projection.exportTag).toBeDefined();

        expect(child.projection.paragraphStyle).toBeDefined();
        expect(child.projection.exportTag).toBeDefined();
    });

});