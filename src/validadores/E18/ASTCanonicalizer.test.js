/**
 * E18.2.2 — Suite de Pruebas Contractuales para ASTCanonicalizer (13 Pruebas)
 * Valida inmutabilidad, semántica normativa, herencia del último ancestro con ID,
 * pureza del contentFingerprint y desacoplamiento total de identidad.
 */

'use strict';

const ASTCanonicalizer = require('../../../src/validadores/E18/ASTCanonicalizer');

describe('E18.2.2 — ASTCanonicalizer + SemanticTypeResolver (Contrato Avanzado Completo)', () => {

    test('1. AST vacío retorna estructura canónica vacía', () => {
        const result = ASTCanonicalizer.canonicalize(null);
        expect(result).toEqual({ version: '1.0.0', nodes: [] });
    });

    test('2. AST simple proyecta correctamente nodos básicos', () => {
        const ast = { tipo: 'parrafo', texto: 'Texto base' };
        const result = ASTCanonicalizer.canonicalize(ast);
        expect(result.nodes).toHaveLength(1);
        expect(result.nodes[0].normalizedText).toBe('Texto base');
    });

    test('3. El AST de entrada permanece completamente inmutable', () => {
        const ast = {
            tipo: 'parrafo',
            estiloParrafo: 'P02_TITLE_PART',
            texto: 'Título',
            contenido: [{ texto: 'Sub' }]
        };
        const before = JSON.parse(JSON.stringify(ast));
        ASTCanonicalizer.canonicalize(ast);
        expect(ast).toEqual(before);
    });

    test('4. P02_TITLE_PART produce semántica normativa demostrada', () => {
        const ast = { estiloParrafo: 'P02_TITLE_PART', texto: 'PRIMERA PARTE' };
        const result = ASTCanonicalizer.canonicalize(ast);
        const node = result.nodes[0];

        expect(node.semanticType).toBe('titulo_parte');
        expect(node.nodeKind).toBe('semantic');
        expect(node.evidence.confidence).toBe('DEMONSTRATED');
        expect(node.evidence.ruleId).toBe('SEM-AST-001');
    });

    test('5. P02_TITLE_PART_EXTRA es rechazado estrictamente (NOT_DEMONSTRATED)', () => {
        const ast = { estiloParrafo: 'P02_TITLE_PART_EXTRA', texto: 'Falso' };
        const result = ASTCanonicalizer.canonicalize(ast);
        const node = result.nodes[0];

        expect(node.semanticType).toBeNull();
        expect(node.nodeKind).toBe('text');
        expect(node.evidence.confidence).toBe('NOT_DEMONSTRATED');
        expect(node.evidence.ruleId).toBeNull();
    });

    test('6. Precedencia: estiloParrafo prevalece sobre tipo y tipoNodo', () => {
        const ast = {
            tipo: 'otro',
            tipoNodo: 'otro',
            estiloParrafo: 'P02_TITLE_PART',
            texto: 'Título'
        };
        const result = ASTCanonicalizer.canonicalize(ast);
        const node = result.nodes[0];

        expect(node.semanticType).toBe('titulo_parte');
        expect(node.evidence.ruleId).toBe('SEM-AST-001');
    });

    test('7. idJuridico confiere identidad explícita (IDENTITY.EXPLICIT)', () => {
        const ast = { idJuridico: 'articulo_24', texto: 'Artículo 24' };
        const result = ASTCanonicalizer.canonicalize(ast);
        const node = result.nodes[0];

        expect(node.canonicalId).toBe('document.articulo_24');
        expect(node.identityKind).toBe('IDENTITY.EXPLICIT');
    });

    test('8. Ausencia de idJuridico deja canonicalId en null (IDENTITY.UNSTABLE)', () => {
        const ast = { estiloParrafo: 'P01_BODY_CONT', texto: 'Cuerpo' };
        const result = ASTCanonicalizer.canonicalize(ast);
        const node = result.nodes[0];

        expect(node.canonicalId).toBeNull();
        expect(node.identityKind).toBe('IDENTITY.UNSTABLE');
    });

    test('9. El estiloParrafo y el node.id técnico NO generan identidad institucional', () => {
        const ast = { id: 'tech_id_99', estiloParrafo: 'P02_TITLE_PART', texto: 'Parte' };
        const result = ASTCanonicalizer.canonicalize(ast);
        const node = result.nodes[0];

        expect(node.canonicalId).toBeNull();
        expect(node.identityKind).toBe('IDENTITY.UNSTABLE');
    });

    test('10. Cambiar el estilo NO altera la identidad cuando existe idJuridico', () => {
        const astA = { idJuridico: '24', estiloParrafo: 'P02_TITLE_PART', texto: 'Art 24' };
        const astB = { idJuridico: '24', estiloParrafo: 'P01_BODY_CONT', texto: 'Art 24' };

        const resA = ASTCanonicalizer.canonicalize(astA);
        const resB = ASTCanonicalizer.canonicalize(astB);

        expect(resA.nodes[0].canonicalId).toBe('document.24');
        expect(resB.nodes[0].canonicalId).toBe('document.24');
        expect(resA.nodes[0].canonicalId).toBe(resB.nodes[0].canonicalId);
    });

    test('11. El contentFingerprint depende exclusivamente del texto normalizado', () => {
        const astA = { estiloParrafo: 'P02_TITLE_PART', texto: 'Artículo Único' };
        const astB = { estiloParrafo: 'P01_BODY_CONT', texto: 'Artículo Único' };

        const resA = ASTCanonicalizer.canonicalize(astA);
        const resB = ASTCanonicalizer.canonicalize(astB);

        expect(resA.nodes[0].contentFingerprint).toBe(resB.nodes[0].contentFingerprint);
    });

    test('12. Jerarquía estructural propaga correctamente el último ancestro con ID explícito', () => {
        const ast = {
            idJuridico: 'seccion_1',
            texto: 'Sección Principal',
            contenido: [
                {
                    estiloParrafo: 'P02_TITLE_PART',
                    texto: 'Padre sin ID',
                    contenido: [
                        {
                            idJuridico: 'articulo_1',
                            texto: 'Artículo con ID'
                        }
                    ]
                }
            ]
        };
        const result = ASTCanonicalizer.canonicalize(ast);
        expect(result.nodes).toHaveLength(3);

        const root = result.nodes[0];
        const parent = result.nodes[1];
        const child = result.nodes[2];

        expect(root.canonicalId).toBe('document.seccion_1');
        expect(root.parentCanonicalId).toBeNull();

        expect(parent.canonicalId).toBeNull();
        expect(parent.parentCanonicalId).toBe('document.seccion_1');

        expect(child.canonicalId).toBe('document.seccion_1.articulo_1');
        expect(child.parentCanonicalId).toBe('document.seccion_1');
    });

    test('13. Un nodo raíz sin ID mantiene parentCanonicalId en null', () => {
        const ast = {
            estiloParrafo: 'P01_BODY_CONT',
            texto: 'Texto raíz sin ID'
        };
        const result = ASTCanonicalizer.canonicalize(ast);
        expect(result.nodes[0].parentCanonicalId).toBeNull();
    });
});