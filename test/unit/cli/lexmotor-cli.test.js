const fs = require('fs');
const path = require('path');
const os = require('os');
const { ejecutarCLI } = require('../../../src/cli/lexmotorCLI');

describe('F11 — Contrato TDD de la CLI de Lexmotor (Industrializado)', () => {
    let tempDir;
    let inputJsonPath;
    let semanticMapPath;
    let cssPath;
    let outputPath;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'f11-cli-'));
        inputJsonPath = path.join(tempDir, 'fragmento.json');
        semanticMapPath = path.join(tempDir, 'semantic_map.json');
        cssPath = path.join(tempDir, 'styles.css');
        outputPath = path.join(tempDir, 'salida');

        // Artefactos mínimos válidos alineados al Semantic Map de prueba
        fs.writeFileSync(inputJsonPath, JSON.stringify({
            documento: "test.indd",
            contenido: [{ estilo: "P01_BODY_CONT", fragmentos: [{ texto: "Hola Lexmotor", estiloCaracter: "[Ninguno]" }] }]
        }));

        fs.writeFileSync(semanticMapPath, JSON.stringify({
            styles: [{ originalName: "P01_BODY_CONT", type: "paragraph", exportTagging: { epub: { tag: "p", className: "cuerpo-siguiente" } } }]
        }));

        // El CSS real debe cubrir la clase semántica generada por el Semantic Map
        fs.writeFileSync(cssPath, '.cuerpo-siguiente { font-size: 14pt; }');
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('F11.1 & F11.7 — Acepta compile con argumentos válidos y devuelve código 0', async () => {
        const exitCode = await ejecutarCLI([
            'compile',
            '--input', inputJsonPath,
            '--semantic-map', semanticMapPath,
            '--css', cssPath,
            '--output', outputPath
        ]);

        expect(exitCode).toBe(0);
        expect(fs.existsSync(path.join(outputPath, 'index.xhtml'))).toBe(true);
    });

    test('F11.2 — Rechaza input inexistente con código de lectura (2)', async () => {
        const exitCode = await ejecutarCLI([
            'compile',
            '--input', path.join(tempDir, 'no-existe.json'),
            '--semantic-map', semanticMapPath,
            '--css', cssPath,
            '--output', outputPath
        ]);

        expect(exitCode).toBe(2);
    });

    test('F11.3 — Rechaza semantic-map inexistente con código (2)', async () => {
        const exitCode = await ejecutarCLI([
            'compile',
            '--input', inputJsonPath,
            '--semantic-map', path.join(tempDir, 'map-falso.json'),
            '--css', cssPath,
            '--output', outputPath
        ]);

        expect(exitCode).toBe(2);
    });

    test('F11.4 — Rechaza flags desconocidos o sintaxis incompleta con código (1)', async () => {
        const exitCode1 = await ejecutarCLI(['compile', '--input', inputJsonPath]); // Incompleto
        const exitCode2 = await ejecutarCLI(['compile', '--input', inputJsonPath, '--semantic-map', semanticMapPath, '--css', cssPath, '--output', outputPath, '--foo', 'bar']); // Desconocido

        expect(exitCode1).toBe(1);
        expect(exitCode2).toBe(1);
    });

    test('F11.5 — JSON malformado genera error de lectura/parseo (Código 2) y no contamina E10', async () => {
        const inputInvalido = path.join(tempDir, 'invalido.json');
        fs.writeFileSync(inputInvalido, 'NO_ES_UN_JSON_VALIDO');

        const exitCode = await ejecutarCLI([
            'compile',
            '--input', inputInvalido,
            '--semantic-map', semanticMapPath,
            '--css', cssPath,
            '--output', outputPath
        ]);

        expect(exitCode).toBe(2);
    });

    test('F11.5b — E10 actúa como Gatekeeper ante estilos huérfanos/inválidos devolviendo Código 3', async () => {
        // JSON con un estilo que no existe en el semanticMap, forzando valid=false en E10
        const inputHuérfano = path.join(tempDir, 'huerfano.json');
        fs.writeFileSync(inputHuérfano, JSON.stringify({
            documento: "test.indd",
            contenido: [{ estilo: "ESTILO_INVENTADO_99", fragmentos: [{ texto: "Error", estiloCaracter: "[Ninguno]" }] }]
        }));

        const exitCode = await ejecutarCLI([
            'compile',
            '--input', inputHuérfano,
            '--semantic-map', semanticMapPath,
            '--css', cssPath,
            '--output', outputPath
        ]);

        expect(exitCode).toBe(3);
    });

    test('F11.6 & F11.8 — Devuelve código 5 ante fallas de cobertura CSS real', async () => {
        // CSS ausente de la clase requerida por el mapa (.cuerpo-siguiente)
        fs.writeFileSync(cssPath, '.clase-diferente { color: red; }');

        const exitCode = await ejecutarCLI([
            'compile',
            '--input', inputJsonPath,
            '--semantic-map', semanticMapPath,
            '--css', cssPath,
            '--output', outputPath
        ]);

        expect(exitCode).toBe(5);
    });

    test('F11.9 — Inmutabilidad: No modifica los archivos de entrada originales', async () => {
        const inputOriginal = fs.readFileSync(inputJsonPath, 'utf8');
        const mapOriginal = fs.readFileSync(semanticMapPath, 'utf8');

        await ejecutarCLI([
            'compile',
            '--input', inputJsonPath,
            '--semantic-map', semanticMapPath,
            '--css', cssPath,
            '--output', outputPath
        ]);

        expect(fs.readFileSync(inputJsonPath, 'utf8')).toBe(inputOriginal);
        expect(fs.readFileSync(semanticMapPath, 'utf8')).toBe(mapOriginal);
    });

    test('F11.10 — Determinismo: Ejecución repetida produce el mismo resultado idéntico', async () => {
        const salida1 = path.join(tempDir, 'salida1');
        const salida2 = path.join(tempDir, 'salida2');

        await ejecutarCLI(['compile', '--input', inputJsonPath, '--semantic-map', semanticMapPath, '--css', cssPath, '--output', salida1]);
        await ejecutarCLI(['compile', '--input', inputJsonPath, '--semantic-map', semanticMapPath, '--css', cssPath, '--output', salida2]);

        const xhtml1 = fs.readFileSync(path.join(salida1, 'index.xhtml'), 'utf8');
        const xhtml2 = fs.readFileSync(path.join(salida2, 'index.xhtml'), 'utf8');

        expect(xhtml1).toBe(xhtml2);
    });
});