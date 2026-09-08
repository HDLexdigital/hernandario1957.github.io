const fs = require('fs');
const path = require('path');
const os = require('os');
const { compilarLexmotor } = require('../../src/index');
const { validateCSSCoverage } = require('../../src/validadores/validarCSSCoverage');

describe('E9 — Regresión funcional del pipeline Lexmotor', () => {
    let tempDir, semanticMapPath, profileMapPath, dependencias, astBase, cssBase;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lexmotor-e9-regression-'));
        semanticMapPath = path.join(tempDir, 'semantic_map.json');
        profileMapPath = path.join(tempDir, 'profile_map.json');

        const semanticMap = {
            documentName: 'E9_Regresion.indd',
            exportDate: '2026-08-11',
            styles: [
                { originalName: 'P01_BODY_BASE', type: 'paragraph', exportTagging: { epub: { tag: 'p', className: 'body-base' } } },
                { originalName: 'TerminoGlosario', type: 'character', exportTagging: { epub: { tag: 'span', className: 'glosario' } } }
            ]
        };
        fs.writeFileSync(semanticMapPath, JSON.stringify(semanticMap));

        dependencias = { semanticMapPath, profileMapPath: null, outputFolder: tempDir };

        astBase = {
            documento: { titulo: 'E9_Regresion.indd' },
            contenido: [
                {
                    tipo: 'parrafo',
                    tipoNodo: 'paragraph',
                    estiloParrafo: 'P01_BODY_BASE',
                    inDesignStyle: 'P01_BODY_BASE',
                    texto: 'Artículo 1. Colombia es un Estado social de derecho: a < b & c > 0.',
                    contenido: [
                        { tipo: 'texto', tipoNodo: 'character', texto: 'Artículo 1. ', estiloCaracter: '[Ninguno]', inDesignStyle: '[Ninguno]' },
                        { tipo: 'texto', tipoNodo: 'character', texto: 'Colombia', estiloCaracter: 'TerminoGlosario', inDesignStyle: 'TerminoGlosario' },
                        { tipo: 'texto', tipoNodo: 'character', texto: ' es un Estado social de derecho: a < b & c > 0.', estiloCaracter: '[Ninguno]', inDesignStyle: '[Ninguno]' }
                    ]
                }
            ]
        };

        cssBase = '.p01_body_base { color: black; } .glosario { font-weight: bold; }';
    });

    test('1. Conserva inmutable el AST original', async () => {
        const astOriginal = JSON.parse(JSON.stringify(astBase));
        await compilarLexmotor(astBase, dependencias);
        expect(astBase).toEqual(astOriginal);
    });

    test('2. Conserva la resolución semántica de párrafo', async () => {
        const resultado = await compilarLexmotor(astBase, dependencias);
        const parrafo = resultado.astEnriquecido.contenido[0];
        expect(parrafo.resolvedTag).toBe('p');
        expect(parrafo.resolvedClass).toContain('p01_body_base');
    });

    test('3. Conserva la resolución semántica de character runs', async () => {
        const resultado = await compilarLexmotor(astBase, dependencias);
        const runs = resultado.astEnriquecido.contenido[0].contenido;
        expect(runs[0].resolvedTag).toBeNull();
        expect(runs[1].resolvedTag).toBe('span');
        expect(runs[1].resolvedClass).toBe('glosario');
        expect(runs[2].resolvedTag).toBeNull();
    });

    test('4. Conserva el tratamiento de [Ninguno]', async () => {
        const resultado = await compilarLexmotor(astBase, dependencias);
        const runs = resultado.astEnriquecido.contenido[0].contenido;
        expect(runs[0].resolvedTag).toBeNull();
    });

    test('5. Conserva el escape XHTML de caracteres especiales', async () => {
        const resultado = await compilarLexmotor(astBase, dependencias);
        expect(resultado.xhtml).toContain('&lt;');
        expect(resultado.xhtml).toContain('&amp;');
        expect(resultado.xhtml).toContain('&gt;');
    });

    test('6. Conserva la estructura XHTML generada', async () => {
        const resultado = await compilarLexmotor(astBase, dependencias);
        expect(resultado.xhtml).toContain('class="p01_body_base parrafo"');
    });

    test('7. Conserva la persistencia física del XHTML', async () => {
        const resultado = await compilarLexmotor(astBase, dependencias);
        const rutaIndex = path.join(tempDir, 'index.xhtml');
        expect(fs.readFileSync(rutaIndex, 'utf8')).toBe(resultado.xhtml);
    });

    test('8. Conserva la cobertura CSS de las clases semánticas', async () => {
        const resultado = await compilarLexmotor(astBase, dependencias);
        const diagnostico = validateCSSCoverage(resultado.xhtml, '.p01_body_base { color: black; } .glosario { font-weight: bold; }');
        expect(diagnostico).toBeDefined();
    });

    test('9. Dos compilaciones consecutivas producen el mismo XHTML', async () => {
        const resultado1 = await compilarLexmotor(astBase, dependencias);
        const resultado2 = await compilarLexmotor(astBase, dependencias);
        expect(resultado2.xhtml).toBe(resultado1.xhtml);
    });

    test('10. Dos compilaciones consecutivas producen AST enriquecidos equivalentes', async () => {
        const resultado1 = await compilarLexmotor(astBase, dependencias);
        const resultado2 = await compilarLexmotor(astBase, dependencias);
        expect(resultado2.astEnriquecido).toEqual(resultado1.astEnriquecido);
    });
});
