/**
 * E18.2.3.2 — Suite Contractual Sintética para DOMCanonicalizer (17 Pruebas)
 * Valida el contrato normativo sobre XHTML sintético respaldado por la evidencia empírica E18.2.3.4.
 */

'use strict';

const DOMCanonicalizer = require('../../../src/validadores/E18/DOMCanonicalizer');

describe('E18.2.3.2 — DOMCanonicalizer (Contrato Sintético - Cierre Empírico)', () => {

    test('1. XHTML vacío retorna estructura canónica vacía', () => {
        const result = DOMCanonicalizer.canonicalize(null);
        expect(result).toEqual({ version: '1.0.0', nodes: [] });
    });

    test('2. Nodo XHTML básico proyecta correctamente', () => {
        const dom = { tag: 'p', texto: 'Contenido básico' };
        const result = DOMCanonicalizer.canonicalize(dom);
        expect(result.nodes).toHaveLength(1);
        expect(result.nodes[0].normalizedText).toBe('Contenido básico');
    });

    test('3. Clase normativa p02_title_part produce titulo_parte / semantic', () => {
        const dom = { tag: 'p', classes: ['p02_title_part'], texto: 'PRIMERA PARTE' };
        const result = DOMCanonicalizer.canonicalize(dom);
        const node = result.nodes[0];

        expect(node.semanticType).toBe('titulo_parte');
        expect(node.nodeKind).toBe('semantic');
        expect(node.evidence.confidence).toBe('DEMONSTRATED');
    });

    test('4. Clase normativa p02_title_main produce titulo_principal', () => {
        const dom = { tag: 'p', classes: ['p02_title_main'], texto: 'CONSTITUCIÓN' };
        const result = DOMCanonicalizer.canonicalize(dom);
        expect(result.nodes[0].semanticType).toBe('titulo_principal');
    });

    test('5. Clase normativa p03_center_bold produce parrafo_destacado', () => {
        const dom = { tag: 'p', classes: ['p03_center_bold'], texto: 'Texto' };
        const result = DOMCanonicalizer.canonicalize(dom);
        expect(result.nodes[0].semanticType).toBe('parrafo_destacado');
    });

    test('6. Clase normativa p01_body_cont produce parrafo / text', () => {
        const dom = { tag: 'p', classes: ['p01_body_cont'], texto: 'Contenido' };
        const result = DOMCanonicalizer.canonicalize(dom);
        expect(result.nodes[0].semanticType).toBe('parrafo');
        expect(result.nodes[0].nodeKind).toBe('text');
    });

    test('7. Clase p02_title_part_extra es rechazada estrictamente', () => {
        const dom = { tag: 'p', classes: ['p02_title_part_extra'], texto: 'Falso' };
        const result = DOMCanonicalizer.canonicalize(dom);
        expect(result.nodes[0].semanticType).toBeNull();
        expect(result.nodes[0].evidence.confidence).toBe('NOT_DEMONSTRATED');
    });

    test('8. Clase CSS desconocida es NOT_DEMONSTRATED', () => {
        const dom = { tag: 'p', classes: ['clase_inventada'], texto: 'X' };
        const result = DOMCanonicalizer.canonicalize(dom);
        expect(result.nodes[0].semanticType).toBeNull();
    });

    test('9. Clase normativa + desconocida: gana la normativa exacta', () => {
        const dom = { tag: 'p', classes: ['p02_title_part', 'inventada'], texto: 'T' };
        const result = DOMCanonicalizer.canonicalize(dom);
        expect(result.nodes[0].semanticType).toBe('titulo_parte');
    });

    test('10. Clase CSS NO genera identidad (IDENTITY.UNSTABLE)', () => {
        const dom = { tag: 'p', classes: ['p02_title_part'], texto: 'T' };
        const result = DOMCanonicalizer.canonicalize(dom);
        expect(result.nodes[0].canonicalId).toBeNull();
        expect(result.nodes[0].identityKind).toBe('IDENTITY.UNSTABLE');
    });

    test('11. Orden DOM NO genera identidad', () => {
        const dom = { tag: 'div', contenido: [{ tag: 'p', texto: 'A' }, { tag: 'p', texto: 'B' }] };
        const result = DOMCanonicalizer.canonicalize(dom);
        expect(result.nodes[0].canonicalId).toBeNull();
        expect(result.nodes[1].canonicalId).toBeNull();
    });

    test('12. El contentFingerprint depende exclusivamente del texto normalizado (desacoplado de clases reales)', () => {
        const domA = { tag: 'p', classes: ['p02_title_part'], texto: 'Artículo Único' };
        const domB = { tag: 'p', classes: ['p03_center_bold'], texto: 'Artículo Único' };

        const resA = DOMCanonicalizer.canonicalize(domA);
        const resB = DOMCanonicalizer.canonicalize(domB);

        expect(resA.nodes[0].contentFingerprint).toBe(resB.nodes[0].contentFingerprint);
    });

    test('13. Atributo id técnico genérico NO confiere IDENTITY.EXPLICIT', () => {
        const dom = { tag: 'p', id: 'tech_123', texto: 'X' };
        const result = DOMCanonicalizer.canonicalize(dom);
        expect(result.nodes[0].canonicalId).toBeNull();
        expect(result.nodes[0].identityKind).toBe('IDENTITY.UNSTABLE');
    });

    test('14. Atributos id técnicos o data-* no institucionales no confieren identidad (Validación empírica E18.2.3.4)', () => {
        const dom = {
            tag: 'p',
            id: 'tech_123',
            'data-id-juridico': 'art_24',
            texto: 'X'
        };
        const result = DOMCanonicalizer.canonicalize(dom);
        const node = result.nodes[0];

        expect(node.canonicalId).toBeNull();
        expect(node.identityKind).toBe('IDENTITY.UNSTABLE');
    });

    test('15. El AST no participa en la resolución DOM (sourceType === XHTML)', () => {
        const dom = { tag: 'p', classes: ['p01_body_cont'], texto: 'X' };
        const result = DOMCanonicalizer.canonicalize(dom);
        expect(result.nodes[0].evidence.sourceType).toBe('XHTML');
    });

    test('16. XHTML fuente permanece inmutable', () => {
        const dom = { tag: 'p', classes: ['p01_body_cont'], texto: 'A', contenido: [{ tag: 'span', texto: 'B' }] };
        const before = JSON.parse(JSON.stringify(dom));
        DOMCanonicalizer.canonicalize(dom);
        expect(dom).toEqual(before);
    });

    test('17. Propagación jerárquica: ancestro sin ID mantiene inestabilidad', () => {
        const dom = {
            'data-id-juridico': 'sec_1', // Este atributo ya no es reconocido como institucional
            texto: 'Sección',
            contenido: [{
                classes: ['p01_body_cont'],
                texto: 'Padre sin ID',
                contenido: [{
                    'data-id-juridico': 'art_1',
                    classes: ['p01_body_cont'],
                    texto: 'Hijo'
                }]
            }]
        };
        const result = DOMCanonicalizer.canonicalize(dom);
        // Dado que el compilador no emite identidad, todo es IDENTITY.UNSTABLE
        expect(result.nodes[0].canonicalId).toBeNull();
        expect(result.nodes[1].parentCanonicalId).toBeNull();
        expect(result.nodes[2].parentCanonicalId).toBeNull();
    });
});