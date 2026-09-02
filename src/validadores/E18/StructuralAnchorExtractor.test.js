/**
 * E18.2.5.3-A — Suite Contractual Sintética para StructuralAnchorExtractor (16 Pruebas)
 * 
 * Fase: RED
 * 
 * Contrato:
 * - Extracción estrictamente intradiádica (monofuente: AST o DOM por separado).
 * - Normalización de clave (key) y preservación exacta de texto crudo (rawText).
 * - Rechazo de falsos positivos y textos ambiguos.
 * - Inmutabilidad absoluta del documento fuente.
 * - Cero conocimiento del documento contraparte.
 * - Cero uso de semanticType como sustituto de evidencia textual estructural.
 */

'use strict';

// El componente está bloqueado hasta que los tests fallen estructuralmente (Fase RED)
const StructuralAnchorExtractor = require('../../../src/validadores/E18/StructuralAnchorExtractor');

describe('E18.2.5.3-A — StructuralAnchorExtractor (Contrato Sintético - Fase RED)', () => {

    const createNode = (index, text, semanticType = 'parrafo') => ({
        index,
        normalizedText: text,
        semanticType,
        nodeKind: 'text',
        contentFingerprint: `sha256:${text}`
    });

    const createDoc = (nodes, source = 'AST') => ({ version: '1.0.0', source, nodes });

    test('1. ARTICLE correctamente detectado a partir de formato estándar', () => {
        const doc = createDoc([createNode(5, 'Artículo 72. El patrimonio cultural...')]);
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        expect(result.anchors).toHaveLength(1);
        expect(result.anchors[0].type).toBe('ARTICLE');
        expect(result.anchors[0].key).toBe('72');
        expect(result.anchors[0].index).toBe(5);
    });

    test('2. Variaciones de capitalización (ej. ARTÍCULO) son correctamente detectadas', () => {
        const doc = createDoc([createNode(0, 'ARTÍCULO 1. Definición inicial.')]);
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        expect(result.anchors).toHaveLength(1);
        expect(result.anchors[0].key).toBe('1');
    });

    test('3. Variaciones tipográficas permitidas alrededor del número (símbolos, puntos, guiones)', () => {
        const doc = createDoc([
            createNode(0, 'Artículo 22A. Garantía especial.'),
            createNode(1, 'Art. 15.- Términos de ley.')
        ]);
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        expect(result.anchors).toHaveLength(2);
        expect(result.anchors[0].key).toBe('22A');
        expect(result.anchors[1].key).toBe('15');
    });

    test('4. Conservación exacta del texto original en rawText', () => {
        const raw = 'Artículo 42. La familia es el...';
        const doc = createDoc([createNode(10, raw)]);
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        expect(result.anchors[0].rawText).toBe(raw);
    });

    test('5. La clave (key) se normaliza independientemente del prefijo', () => {
        const doc = createDoc([createNode(0, 'Artículo   53. El Congreso...')]);
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        expect(result.anchors[0].key).toBe('53');
    });

    test('6. Índice exacto del nodo conservado en el anclaje', () => {
        const doc = createDoc([
            createNode(0, 'Encabezado sin artículo'),
            createNode(4, 'Artículo 10. Idioma oficial.')
        ]);
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        expect(result.anchors[0].index).toBe(4);
    });

    test('7. Múltiples artículos detectados en orden estricto', () => {
        const doc = createDoc([
            createNode(0, 'Artículo 1. Colombia es...'),
            createNode(1, 'Artículo 2. Son fines...'),
            createNode(2, 'Artículo 3. La soberanía...')
        ]);
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        expect(result.anchors).toHaveLength(3);
        expect(result.anchors.map(a => a.key)).toEqual(['1', '2', '3']);
    });

    test('8. Artículos no consecutivos son extraídos correctamente sin alterar secuencias', () => {
        const doc = createDoc([
            createNode(0, 'Artículo 10. Idioma.'),
            createNode(1, 'Artículo 15. Intimidad.') // Salto del 11 al 14 omitido en el fragmento
        ]);
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        expect(result.anchors).toHaveLength(2);
        expect(result.anchors[0].key).toBe('10');
        expect(result.anchors[1].key).toBe('15');
    });

    test('9. Falsos positivos: Texto que contiene la palabra "artículo" en la prosa no constituye anclaje', () => {
        const doc = createDoc([
            createNode(0, 'Como se indicó en el artículo anterior, la norma...'),
            createNode(1, 'El presente artículo regula las materias...')
        ]);
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        expect(result.anchors).toHaveLength(0);
    });

    test('10. Ausencia total de anclajes retorna lista vacía de forma estructurada', () => {
        const doc = createDoc([createNode(0, 'Texto plano sin hitos normativos.')]);
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        expect(result.anchors).toHaveLength(0);
        expect(result.source).toBe('AST');
    });

    test('11. Soporte independiente para origen DOM mediante la propiedad source', () => {
        const doc = createDoc([createNode(0, 'Artículo 1. Texto DOM.')], 'DOM');
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        expect(result.source).toBe('DOM');
        expect(result.anchors[0].key).toBe('1');
    });

    test('12. Inmutabilidad absoluta del documento fuente', () => {
        const doc = createDoc([createNode(0, 'Artículo 5. El Estado...')]);
        const clone = JSON.parse(JSON.stringify(doc));
        
        StructuralAnchorExtractor.extract(doc);
        
        expect(doc).toEqual(clone);
    });

    test('13. Ausencia de conocimiento del documento contraparte (extracción puramente intradiádica)', () => {
        const doc = createDoc([createNode(0, 'Artículo 8. Obligación.')]);
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        // El objeto de salida no debe requerir ni contener referencias a estructuras externas
        expect(result).not.toHaveProperty('counterpart');
        expect(result).not.toHaveProperty('alignment');
    });

    test('14. No utilización de semanticType como criterio suficiente de anclaje', () => {
        // El nodo dice ser de semanticType 'articulo', pero su texto no tiene estructura de artículo
        const doc = createDoc([{
            index: 0,
            normalizedText: 'Texto arbitrario sin número normativo',
            semanticType: 'articulo',
            nodeKind: 'semantic'
        }]);
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        expect(result.anchors).toHaveLength(0);
    });

    test('15. El extractor no reordena el array nodes[] del documento', () => {
        const nodes = [
            createNode(2, 'Artículo 2. Segundo.'),
            createNode(0, 'Artículo 1. Primero.') // Desordenado a propósito en el array fuente
        ];
        const doc = createDoc(nodes);
        
        StructuralAnchorExtractor.extract(doc);
        
        expect(doc.nodes[0].index).toBe(2);
        expect(doc.nodes[1].index).toBe(0);
    });

    test('16. Preservación pasiva: anclajes ambiguos o malformados se descartan como no detectados', () => {
        const doc = createDoc([
            createNode(0, 'Artículo sin número definido'),
            createNode(1, 'Artículo .')
        ]);
        
        const result = StructuralAnchorExtractor.extract(doc);
        
        expect(result.anchors).toHaveLength(0);
    });

});