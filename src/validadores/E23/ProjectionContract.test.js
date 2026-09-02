/**
 * E23.3.1 — Projection Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Plan de Proyección Editorial (AST → Projection Plan):
 * - Convierte un Árbol Derivado certificado (E21) en un plan de proyección estructurado para InDesign.
 * - Exige mapeos explícitos para cada tipo de dominio (DOMAIN TYPE ≠ INDESIGN STYLE).
 * - Emite un estado PROJECTION_UNKNOWN si encuentra entidades no mapeadas.
 * - Garantiza inmutabilidad del AST de entrada y determinismo absoluto (mismo AST + reglas = mismo plan).
 */

'use strict';

// El adaptador de proyección aún no está implementado (Fase RED esperada)
const ProjectionAdapter = require('../../../src/validadores/E23/ProjectionAdapter');

describe('E23.3.1 — Projection Contract (Fase RED)', () => {

    const mockCertifiedAST = Object.freeze({
        version: 'E21.0.0',
        nodes: [
            {
                baseDossierId: 'ARTICULO_1',
                semanticType: 'ARTICULO',
                content: 'Texto del artículo 1',
                provenance: { e18_Ref: 'ARTICULO_1' },
                children: [
                    {
                        baseDossierId: 'PARRAFO_1',
                        semanticType: 'PARRAFO',
                        content: 'Párrafo subordinado'
                    }
                ]
            }
        ]
    });

    const mockMappingRules = Object.freeze({
        'ARTICULO': { paragraphStyle: 'LD_Articulo_Style', exportTag: 'article' },
        'PARRAFO': { paragraphStyle: 'LD_Parrafo_Style', exportTag: 'p' }
    });

    test('1. PLAN STRUCTURE: Genera un plan de proyección estructurado e intermedio sin alterar InDesign', () => {
        const plan = ProjectionAdapter.generatePlan(mockCertifiedAST, mockMappingRules);

        expect(plan).toBeDefined();
        expect(plan.projectionVersion).toBe('E23.3.1');
        expect(plan.source.stage).toBe('E21');
        expect(Array.isArray(plan.nodes)).toBe(true);
        expect(plan.nodes.length).toBe(1);
    });

    test('2. EXPLICIT MAPPING: Asocia el DOMAIN TYPE con el estilo editorial configurado', () => {
        const plan = ProjectionAdapter.generatePlan(mockCertifiedAST, mockMappingRules);
        const projectedArticle = plan.nodes[0];

        expect(projectedArticle.domainType).toBe('ARTICULO');
        expect(projectedArticle.projection.paragraphStyle).toBe('LD_Articulo_Style');
        expect(projectedArticle.children[0].projection.paragraphStyle).toBe('LD_Parrafo_Style');
    });

    test('3. UNKNOWN HANDLING: Emite un error o marca PROJECTION_UNKNOWN si un nodo carece de regla de mapeo', () => {
        const incompleteRules = {
            'ARTICULO': { paragraphStyle: 'LD_Articulo_Style' }
            // Falta regla para 'PARRAFO'
        };

        expect(() => {
            ProjectionAdapter.generatePlan(mockCertifiedAST, incompleteRules);
        }).toThrow(/PROJECTION_MAPPING_VIOLATION/);
    });

    test('4. DETERMINISM & IMMUTABILITY: Mismo AST + mismas reglas = Plan idéntico. Input intacto.', () => {
        const astSnapshot = JSON.stringify(mockCertifiedAST);

        const firstPlan = ProjectionAdapter.generatePlan(mockCertifiedAST, mockMappingRules);
        const secondPlan = ProjectionAdapter.generatePlan(mockCertifiedAST, mockMappingRules);

        // Determinismo absoluto
        expect(JSON.stringify(firstPlan)).toBe(JSON.stringify(secondPlan));

        // Inmutabilidad estricta del AST original
        expect(JSON.stringify(mockCertifiedAST)).toBe(astSnapshot);
    });

});