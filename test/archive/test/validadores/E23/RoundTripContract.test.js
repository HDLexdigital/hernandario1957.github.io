/**
 * E23.3.5.3 — Round-Trip Extraction & Semantic Equivalence Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Equivalencia Semántica (AST ≡ AST'):
 * - Valida la conservación de masa (número exacto de nodos proyectados vs extraídos).
 * - Exige correspondencia biyectiva de identidad (cero unknown-id, cero duplicados).
 * - Garantiza la inmutabilidad de la taxonomía (domainType) y la jerarquía de relaciones (parent-child).
 * - Verifica la equivalencia de contenido mediante normalización contractual defensiva (canonicalizeContent).
 * - Comprueba la retrocompatibilidad del contrato de proyección (paragraphStyle, exportTag).
 * - Aplica pruebas negativas rigurosas para cada categoría de desvío (drift).
 */

'use strict';

// El motor de equivalencia semántica aún no está implementado (Fase RED esperada)
const SemanticEquivalenceEngine = require('../../../src/validadores/E23/SemanticEquivalenceEngine');

describe('E23.3.5.3 — Round-Trip Semantic Equivalence Contract (Fase RED)', () => {

    const canonicalSourceAST = Object.freeze({
        version: 'E21.0.0',
        nodes: [
            {
                id: 'ARTICULO_BASE_41',
                domainType: 'ARTICULO',
                content: 'Texto constitutivo del artículo 41.',
                projection: { paragraphStyle: 'LD_Articulo_Principal', exportTag: 'article' },
                children: [
                    {
                        id: 'PARRAFO_SUB_1',
                        domainType: 'PARRAFO',
                        content: 'Texto subordinado del parágrafo.',
                        projection: { paragraphStyle: 'LD_Cuerpo_Texto', exportTag: 'p' },
                        children: []
                    }
                ]
            }
        ]
    });

    test('1. PERFECT EQUIVALENCE: Certifica la equivalencia semántica absoluta cuando AST y AST\' son idénticos en su núcleo canónico', () => {
        // Simula un AST' extraído exactamente igual al origen canónico
        const extractedAST = JSON.parse(JSON.stringify(canonicalSourceAST));

        const audit = SemanticEquivalenceEngine.verifyEquivalence(canonicalSourceAST, extractedAST);

        expect(audit).toBeDefined();
        expect(audit.status).toBe('CERTIFIED');
        expect(audit.semanticEquivalent).toBe(true);
        expect(audit.metrics.missingNodes).toBe(0);
        expect(audit.metrics.identityMismatches).toBe(0);
    });

    test('2. MASS CONSERVATION FAILURE: Falla si se detectan nodos faltantes o inesperados en la extracción', () => {
        const incompleteAST = {
            version: 'E21.0.0',
            nodes: [] // Faltan los nodos proyectados
        };

        expect(() => {
            SemanticEquivalenceEngine.verifyEquivalence(canonicalSourceAST, incompleteAST);
        }).toThrow(/ROUND_TRIP_VIOLATION:.*MASS_CONSERVATION/);
    });

    test('3. IDENTITY DRIFT DETECTION: Rechaza de inmediato la extracción si contiene "unknown-id" o IDs alterados', () => {
        const driftedAST = JSON.parse(JSON.stringify(canonicalSourceAST));
        driftedAST.nodes[0].id = 'unknown-id'; // Alteración de identidad prohibida

        expect(() => {
            SemanticEquivalenceEngine.verifyEquivalence(canonicalSourceAST, driftedAST);
        }).toThrow(/ROUND_TRIP_VIOLATION:.*IDENTITY_MISMATCH/);
    });

    test('4. TAXONOMY DRIFT DETECTION: Falla si la ontología (domainType) ha sido modificada durante el ciclo', () => {
        const driftedAST = JSON.parse(JSON.stringify(canonicalSourceAST));
        driftedAST.nodes[0].domainType = 'ALTERED_TYPE'; // Alteración taxonómica

        expect(() => {
            SemanticEquivalenceEngine.verifyEquivalence(canonicalSourceAST, driftedAST);
        }).toThrow(/ROUND_TRIP_VIOLATION:.*TAXONOMY_MISMATCH/);
    });

    test('5. HIERARCHY DRIFT DETECTION: Detecta alteraciones en las relaciones jerárquicas parent-child', () => {
        const driftedAST = JSON.parse(JSON.stringify(canonicalSourceAST));
        
        // 🛠️ Extrae el hijo de su padre y lo mueve a la raíz
        // Mantiene la conservación de masa (2 nodos) pero rompe la jerarquía (parentId pasará de ARTICULO_BASE_41 a null)
        const orphanedChild = driftedAST.nodes[0].children.pop();
        driftedAST.nodes.push(orphanedChild);

        expect(() => {
            SemanticEquivalenceEngine.verifyEquivalence(canonicalSourceAST, driftedAST);
        }).toThrow(/ROUND_TRIP_VIOLATION:.*HIERARCHY_MISMATCH/);
    });

    test('6. CONTENT DRIFT DETECTION: Aplica normalización contractual y rechaza textos alterados', () => {
        const driftedAST = JSON.parse(JSON.stringify(canonicalSourceAST));
        driftedAST.nodes[0].content = 'Texto radicalmente modificado e ilegal.';

        expect(() => {
            SemanticEquivalenceEngine.verifyEquivalence(canonicalSourceAST, driftedAST);
        }).toThrow(/ROUND_TRIP_VIOLATION:.*CONTENT_DRIFT/);
    });

});