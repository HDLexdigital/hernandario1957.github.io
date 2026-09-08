const { 
    extractUsedClasses, 
    indexCSSClasses, 
    validateCSSCoverage 
} = require('../../../src/validadores/validarCSSCoverage');

describe('Fase E7: Validador de Cobertura CSS editorial (Unidad independiente)', () => {

    test('1. Extrae correctamente clases del XHTML', () => {
        const xhtml = '<p class="body-base">Texto</p><span class="glosario">Soberanía</span>';
        const classes = extractUsedClasses(xhtml);
        expect(classes.has('body-base')).toBe(true);
        expect(classes.has('glosario')).toBe(true);
        expect(classes.size).toBe(2);
    });

    test('2. Reconoce múltiples clases en un mismo atributo y clases duplicadas', () => {
        const xhtml = '<p class="body-base destacado glosario">Texto</p><span class="glosario">Otra</span>';
        const classes = extractUsedClasses(xhtml);
        expect(classes.size).toBe(3);
        expect(classes.has('body-base')).toBe(true);
        expect(classes.has('destacado')).toBe(true);
        expect(classes.has('glosario')).toBe(true);
    });

    test('3. Ignora nodos sin atributo class', () => {
        const xhtml = '<div><p>Texto plano sin clases</p><span>Otro nodo</span></div>';
        const classes = extractUsedClasses(xhtml);
        expect(classes.size).toBe(0);
    });

    test('4. Indexa correctamente selectores CSS (simples y compuestos)', () => {
        const css = `
            .body-base { font-size: 12pt; }
            p.norma-especial { color: blue; }
            .glosario:hover { font-weight: bold; }
        `;
        const indexed = indexCSSClasses(css);
        expect(indexed.has('body-base')).toBe(true);
        expect(indexed.has('norma-especial')).toBe(true);
        expect(indexed.has('glosario')).toBe(true);
    });

    test('5. XHTML y CSS tienen cobertura completa (válido: true)', () => {
        const xhtml = '<p class="body-base">Art 1</p><span class="glosario">Pueblo</span>';
        const css = '.body-base { margin: 0; } .glosario { font-style: italic; }';
        
        const resultado = validateCSSCoverage(xhtml, css);
        expect(resultado.valid).toBe(true);
        expect(resultado.usedClasses).toEqual(['body-base', 'glosario']);
        expect(resultado.missingClasses).toEqual([]);
    });

    test('6. Detecta una clase utilizada pero ausente en el CSS', () => {
        const xhtml = '<p class="body-base">Art 1</p><span class="termino-ausente">Pueblo</span>';
        const css = '.body-base { margin: 0; }';
        
        const resultado = validateCSSCoverage(xhtml, css);
        expect(resultado.valid).toBe(false);
        expect(resultado.usedClasses).toContain('termino-ausente');
        expect(resultado.missingClasses).toEqual(['termino-ausente']);
    });

    test('7. Detecta varias clases ausentes', () => {
        const xhtml = '<p class="clase-a">1</p><span class="clase-b">2</span>';
        const css = '.clase-c { color: red; }';
        
        const resultado = validateCSSCoverage(xhtml, css);
        expect(resultado.valid).toBe(false);
        expect(resultado.missingClasses).toEqual(['clase-a', 'clase-b']);
    });

    test('8. No considera inválida una regla CSS no utilizada', () => {
        const xhtml = '<p class="body-base">Texto</p>';
        const css = '.body-base { color: black; } .clase-no-usada { display: none; }';
        
        const resultado = validateCSSCoverage(xhtml, css);
        expect(resultado.valid).toBe(true);
        expect(resultado.missingClasses).toEqual([]);
    });

    test('9 y 10. Las funciones de análisis son puras (no modifican entradas)', () => {
        const xhtml = '<p class="body-base">Texto</p>';
        const css = '.body-base { color: black; }';
        const xhtmlOriginal = xhtml;
        const cssOriginal = css;

        validateCSSCoverage(xhtml, css);
        expect(xhtml).toBe(xhtmlOriginal);
        expect(css).toBe(cssOriginal);
    });

    test('11. Entrada XHTML vacía genera diagnóstico válido sin clases usadas', () => {
        const resultado = validateCSSCoverage('', '.clase {}');
        expect(resultado.valid).toBe(true);
        expect(resultado.usedClasses).toEqual([]);
    });

    test('12. CSS vacío genera clases faltantes si el XHTML utiliza estilos', () => {
        const resultado = validateCSSCoverage('<p class="body-base">Texto</p>', '');
        expect(resultado.valid).toBe(false);
        expect(resultado.missingClasses).toEqual(['body-base']);
    });
});