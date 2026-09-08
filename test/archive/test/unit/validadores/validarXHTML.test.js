const { validarXHTML } = require('../../../src/validadores/validarXHTML');

describe('Fase E6: validadorXHTML (Unidad independiente)', () => {
    
    test('1. Valida correctamente XHTML bien formado con etiquetas dinámicas y entidades escapadas', () => {
        const xhtmlValido = '<p class="norma">Artículo 1. La <span class="glosario">soberanía</span> reside con a &lt; b &amp; c y <custom-tag>etiqueta libre</custom-tag>.</p>';
        expect(validarXHTML(xhtmlValido)).toBe(true);
    });

    test('2. Rechaza XHTML con etiquetas mal anidadas o sin cerrar', () => {
        const xhtmlMalAnidado = '<p class="norma">Texto <span class="glosario">soberanía</p></span>';
        expect(() => validarXHTML(xhtmlMalAnidado)).toThrow(/Anidamiento inválido/i);

        const xhtmlSinCerrar = '<p class="norma">Texto sin cerrar';
        expect(() => validarXHTML(xhtmlSinCerrar)).toThrow(/Etiquetas sin cerrar/i);
    });

    test('3. Rechaza etiquetas con sintaxis incompleta o truncada', () => {
        const xhtmlIncompleto = '<p class="norma';
        expect(() => validarXHTML(xhtmlIncompleto)).toThrow();
    });

    test('4. Rechaza ampersands (&) sueltos sin escapar', () => {
        const xhtmlAmpersandRoto = '<p class="norma">Empresa A & B Asociados</p>';
        expect(() => validarXHTML(xhtmlAmpersandRoto)).toThrow(/carácter '&' sin escapar/i);
    });

    test('5. Rechaza caracteres < o > sueltos en el texto', () => {
        const xhtmlMenorSuelto = '<p class="norma">Si 5 < 10 entonces es verdad</p>';
        expect(() => validarXHTML(xhtmlMenorSuelto)).toThrow(/carácter '<' o '>' suelto/i);
    });

    test('6. Rechaza entradas nulas o vacías', () => {
        expect(() => validarXHTML(null)).toThrow(TypeError);
        expect(() => validarXHTML('')).toThrow(/vacío/i);
    });
});