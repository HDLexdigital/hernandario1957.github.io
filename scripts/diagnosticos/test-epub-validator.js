
/**
 * @fileoverview scripts/diagnosticos/test-epub-validator.js
 *
 * E14.4-A — Suite de regresión forense del validador estructural OCF.
 *
 * Objetivos:
 *   - Validar el staging EPUB3 correcto.
 *   - Verificar rechazo de estructuras corruptas.
 *   - Verificar rechazo de path traversal.
 *   - Verificar estabilidad del esquema de respuesta.
 *   - Garantizar Zero Semantic Mutation mediante SHA-256.
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const {
    validarStaging
} = require('../../src/empaquetador/EpubValidator');

const MIME_TYPE = 'application/epub+zip';

async function calcularHash(filePath) {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

async function crearStagingBase() {
    const root = await fs.mkdtemp(
        path.join(os.tmpdir(), 'lexmotor-e14-4-')
    );

    await fs.mkdir(path.join(root, 'META-INF'), { recursive: true });
    await fs.mkdir(path.join(root, 'OEBPS', 'Text'), { recursive: true });
    await fs.mkdir(path.join(root, 'OEBPS', 'Styles'), { recursive: true });

    await fs.writeFile(
        path.join(root, 'mimetype'),
        MIME_TYPE,
        'utf8'
    );

    const containerXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n' +
        '  <rootfiles>\n' +
        '    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n' +
        '  </rootfiles>\n' +
        '</container>';

    await fs.writeFile(
        path.join(root, 'META-INF', 'container.xml'),
        containerXml,
        'utf8'
    );

    await fs.writeFile(
        path.join(root, 'OEBPS', 'Text', 'export.xhtml'),
        '<html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Prueba</h1></body></html>',
        'utf8'
    );

    await fs.writeFile(
        path.join(root, 'OEBPS', 'Styles', 'fragmento.css'),
        '.titulo { color: #000000; }',
        'utf8'
    );

    const navXhtml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">\n' +
        '<body>\n' +
        '<nav epub:type="toc" id="toc">\n' +
        '<ol><li><a href="export.xhtml">Prueba</a></li></ol>\n' +
        '</nav>\n' +
        '</body>\n' +
        '</html>';

    await fs.writeFile(
        path.join(root, 'OEBPS', 'Text', 'nav.xhtml'),
        navXhtml,
        'utf8'
    );

    await escribirOPFValido(root);

    return root;
}

async function escribirOPFValido(root) {
    const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package
    xmlns="http://www.idpf.org/2007/opf"
    version="3.0"
    unique-identifier="pub-id">

  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">urn:uuid:12345678-1234-4234-8234-123456789abc</dc:identifier>
    <dc:title>Prueba E14.4</dc:title>
    <dc:language>es-CO</dc:language>
  </metadata>

  <manifest>
    <item
        id="content"
        href="Text/export.xhtml"
        media-type="application/xhtml+xml"/>

    <item
        id="style"
        href="Styles/fragmento.css"
        media-type="text/css"/>

    <item
        id="nav"
        href="Text/nav.xhtml"
        media-type="application/xhtml+xml"
        properties="nav"/>
  </manifest>

  <spine>
    <itemref idref="content"/>
  </spine>

</package>`;

    await fs.writeFile(
        path.join(root, 'OEBPS', 'content.opf'),
        opf,
        'utf8'
    );
}

async function esperarErrorDeCodigo(stagingDir, codigo) {
    const report = await validarStaging(stagingDir);

    if (report.valid) {
        throw new Error(
            `Se esperaba staging inválido, pero valid === true. Código esperado: ${codigo}`
        );
    }

    const encontrado = report.errors.some(
        error => error.code === codigo
    );

    if (!encontrado) {
        throw new Error(
            `No se encontró el código ${codigo}. ` +
            `Errores recibidos: ${JSON.stringify(report.errors)}`
        );
    }

    return report;
}

async function assertSchema(report) {
    const claves = [
        'valid',
        'errors',
        'warnings',
        'manifest',
        'spine',
        'navigation'
    ];

    for (const clave of claves) {
        if (!Object.prototype.hasOwnProperty.call(report, clave)) {
            throw new Error(
                `El reporte carece de la propiedad contractual "${clave}".`
            );
        }
    }

    if (!Array.isArray(report.errors)) {
        throw new Error('report.errors debe ser Array.');
    }

    if (!Array.isArray(report.warnings)) {
        throw new Error('report.warnings debe ser Array.');
    }

    if (!report.manifest || typeof report.manifest !== 'object') {
        throw new Error('report.manifest debe ser objeto.');
    }

    if (!report.spine || typeof report.spine !== 'object') {
        throw new Error('report.spine debe ser objeto.');
    }
}

async function ejecutarCaso(nombre, funcion) {
    try {
        await funcion();
        console.log(`✅ ${nombre}`);
        return true;
    } catch (error) {
        console.error(`❌ ${nombre}`);
        console.error(`   ${error.message}`);
        return false;
    }
}

async function ejecutarPruebasE14_4() {
    console.log('============================================================');
    console.log('  [E14.4-A] REGRESIÓN FORENSE DEL VALIDADOR OCF');
    console.log('============================================================\n');

    const resultados = [];
    const roots = [];

    /*
     * ============================================================
     * CASO 1 — HAPPY PATH
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 1: staging EPUB3 válido aceptado',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            const report = await validarStaging(root);

            if (!report.valid) {
                throw new Error(
                    `Happy path rechazado: ${JSON.stringify(report.errors)}`
                );
            }

            await assertSchema(report);

            if (report.manifest.declared !== 3) {
                throw new Error(
                    `Manifest esperado: 3; recibido: ${report.manifest.declared}`
                );
            }

            if (report.manifest.existing !== 3) {
                throw new Error(
                    `Recursos físicos esperados: 3; recibido: ${report.manifest.existing}`
                );
            }

            if (report.spine.items !== 1) {
                throw new Error(
                    `Spine esperado: 1; recibido: ${report.spine.items}`
                );
            }

            if (!report.navigation) {
                throw new Error(
                    'No se detectó el recurso properties="nav".'
                );
            }
        }
    ));

    /*
     * ============================================================
     * CASO 2 — MIMETYPE INEXISTENTE
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 2: rechazo de mimetype inexistente',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            await fs.unlink(path.join(root, 'mimetype'));

            await esperarErrorDeCodigo(
                root,
                'E14.4_MISSING_MIMETYPE'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 3 — MIMETYPE INCORRECTO
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 3: rechazo de mimetype incorrecto',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            await fs.writeFile(
                path.join(root, 'mimetype'),
                'application/zip',
                'utf8'
            );

            await esperarErrorDeCodigo(
                root,
                'E14.4_INVALID_MIMETYPE'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 4 — MIMETYPE CON LF
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 4: rechazo de LF en mimetype',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            await fs.writeFile(
                path.join(root, 'mimetype'),
                `${MIME_TYPE}\n`,
                'utf8'
            );

            await esperarErrorDeCodigo(
                root,
                'E14.4_MIMETYPE_LF'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 5 — MIMETYPE CON CRLF
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 5: rechazo de CRLF en mimetype',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            await fs.writeFile(
                path.join(root, 'mimetype'),
                `${MIME_TYPE}\r\n`,
                'utf8'
            );

            await esperarErrorDeCodigo(
                root,
                'E14.4_MIMETYPE_LF'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 6 — CONTAINER INEXISTENTE
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 6: rechazo de container.xml inexistente',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            await fs.unlink(
                path.join(root, 'META-INF', 'container.xml')
            );

            await esperarErrorDeCodigo(
                root,
                'E14.4_MISSING_CONTAINER'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 7 — CONTAINER INCORRECTO
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 7: rechazo de container.xml incorrecto',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            await fs.writeFile(
                path.join(root, 'META-INF', 'container.xml'),
                '<container><rootfile full-path="OEBPS/incorrecto.opf"/></container>',
                'utf8'
            );

            await esperarErrorDeCodigo(
                root,
                'E14.4_INVALID_CONTAINER'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 8 — OPF INEXISTENTE
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 8: rechazo de content.opf inexistente',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            await fs.unlink(
                path.join(root, 'OEBPS', 'content.opf')
            );

            await esperarErrorDeCodigo(
                root,
                'E14.4_MISSING_OPF'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 9 — XML MAL FORMADO
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 9: rechazo de OPF XML mal formado',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            await fs.writeFile(
                path.join(root, 'OEBPS', 'content.opf'),
                '<package><manifest><item></manifest>',
                'utf8'
            );

            await esperarErrorDeCodigo(
                root,
                'E14.4_MALFORMED_OPF'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 10 — MANIFEST VACÍO
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 10: rechazo de manifest vacío',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            const opf = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Vacío</dc:title>
  </metadata>
  <manifest/>
  <spine/>
</package>`;

            await fs.writeFile(
                path.join(root, 'OEBPS', 'content.opf'),
                opf,
                'utf8'
            );

            await esperarErrorDeCodigo(
                root,
                'E14.4_EMPTY_MANIFEST'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 11 — ID DUPLICADO
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 11: rechazo de IDs duplicados',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            const opf = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Duplicado</dc:title>
  </metadata>
  <manifest>
    <item id="duplicado"
          href="Text/export.xhtml"
          media-type="application/xhtml+xml"/>
    <item id="duplicado"
          href="Styles/fragmento.css"
          media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="duplicado"/>
  </spine>
</package>`;

            await fs.writeFile(
                path.join(root, 'OEBPS', 'content.opf'),
                opf,
                'utf8'
            );

            await esperarErrorDeCodigo(
                root,
                'E14.4_DUP_ID'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 12 — RECURSO FANTASMA
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 12: rechazo de recurso declarado inexistente',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            const opf = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Fantasma</dc:title>
  </metadata>
  <manifest>
    <item id="fantasma"
          href="Text/no-existe.xhtml"
          media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="fantasma"/>
  </spine>
</package>`;

            await fs.writeFile(
                path.join(root, 'OEBPS', 'content.opf'),
                opf,
                'utf8'
            );

            await esperarErrorDeCodigo(
                root,
                'E14.4_MISSING_RESOURCE'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 13 — PATH TRAVERSAL ../
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 13: rechazo de path traversal ../',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            const opf = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Traversal</dc:title>
  </metadata>
  <manifest>
    <item id="evil"
          href="../secreto.txt"
          media-type="text/plain"/>
  </manifest>
  <spine>
    <itemref idref="evil"/>
  </spine>
</package>`;

            await fs.writeFile(
                path.join(root, 'OEBPS', 'content.opf'),
                opf,
                'utf8'
            );

            await esperarErrorDeCodigo(
                root,
                'E14.4_PATH_TRAVERSAL'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 14 — HREF ABSOLUTO / PROTOCOLO EXTERNO
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 14: rechazo de href absoluto malicioso',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            const opf = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>URL externa</dc:title>
  </metadata>
  <manifest>
    <item id="evil"
          href="https://example.com/evil.xhtml"
          media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="evil"/>
  </spine>
</package>`;

            await fs.writeFile(
                path.join(root, 'OEBPS', 'content.opf'),
                opf,
                'utf8'
            );

            await esperarErrorDeCodigo(
                root,
                'E14.4_ABSOLUTE_HREF'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 15 — SPINE FANTASMA
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 15: rechazo de idref inexistente en spine',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            const opf = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Spine fantasma</dc:title>
  </metadata>
  <manifest>
    <item id="content"
          href="Text/export.xhtml"
          media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="NO_EXISTE"/>
  </spine>
</package>`;

            await fs.writeFile(
                path.join(root, 'OEBPS', 'content.opf'),
                opf,
                'utf8'
            );

            await esperarErrorDeCodigo(
                root,
                'E14.4_SPINE_FANTASMA'
            );
        }
    ));

    /*
     * ============================================================
     * CASO 16 — NAV FANTASMA
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante 16: rechazo de navegación declarada inexistente',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            const opf = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Nav fantasma</dc:title>
  </metadata>
  <manifest>
    <item id="nav"
          href="Text/nav-no-existe.xhtml"
          media-type="application/xhtml+xml"
          properties="nav"/>
  </manifest>
  <spine>
    <itemref idref="nav"/>
  </spine>
</package>`;

            await fs.writeFile(
                path.join(root, 'OEBPS', 'content.opf'),
                opf,
                'utf8'
            );

            const report = await esperarErrorDeCodigo(
                root,
                'E14.4_MISSING_RESOURCE'
            );

            if (!report.navigation) {
                throw new Error(
                    'El auditor debería identificar el recurso properties="nav" aunque sea inexistente.'
                );
            }
        }
    ));

    /*
     * ============================================================
     * INVARIANTE TRANSVERSAL — ZERO SEMANTIC MUTATION
     * ============================================================
     */

    resultados.push(await ejecutarCaso(
        'Invariante transversal: Zero Semantic Mutation SHA-256',
        async () => {
            const root = await crearStagingBase();
            roots.push(root);

            const xhtmlPath = path.join(
                root,
                'OEBPS',
                'Text',
                'export.xhtml'
            );

            const cssPath = path.join(
                root,
                'OEBPS',
                'Styles',
                'fragmento.css'
            );

            const hashXHTMLAntes = await calcularHash(xhtmlPath);
            const hashCSSAntes = await calcularHash(cssPath);

            const report = await validarStaging(root);

            if (!report.valid) {
                throw new Error(
                    `El staging base debería ser válido: ${JSON.stringify(report.errors)}`
                );
            }

            const hashXHTMLDespues = await calcularHash(xhtmlPath);
            const hashCSSDespues = await calcularHash(cssPath);

            if (hashXHTMLAntes !== hashXHTMLDespues) {
                throw new Error(
                    'Mutación detectada en XHTML durante la validación.'
                );
            }

            if (hashCSSAntes !== hashCSSDespues) {
                throw new Error(
                    'Mutación detectada en CSS durante la validación.'
                );
            }
        }
    ));

    /*
     * ============================================================
     * LIMPIEZA
     * ============================================================
     */

    for (const root of roots) {
        await fs.rm(root, {
            recursive: true,
            force: true
        });
    }

    /*
     * ============================================================
     * RESULTADO FINAL
     * ============================================================
     */

    const aprobados = resultados.filter(Boolean).length;
    const total = resultados.length;

    console.log('\n============================================================');
    console.log(`  RESULTADO E14.4-A: ${aprobados}/${total} PRUEBAS APROBADAS`);
    console.log('============================================================');

    if (aprobados !== total) {
        console.error('\n❌ E14.4-A FALLIDA.');
        console.error('El validador NO debe avanzar a E14.5.\n');
        process.exitCode = 1;
        return;
    }

    console.log('\n🟢 E14.4-A APROBADA.');
    console.log('🟢 Validación estructural OCF congelable.');
    console.log('🟢 Path traversal rechazado.');
    console.log('🟢 Recursos fantasma rechazados.');
    console.log('🟢 Spine fantasma rechazado.');
    console.log('🟢 XML mal formado rechazado.');
    console.log('🟢 Mimetype estricto validado.');
    console.log('🟢 Zero Semantic Mutation verificada por SHA-256.');
    console.log('\n➡️ E14.5 queda habilitada para implementación.\n');
}

ejecutarPruebasE14_4().catch(error => {
    console.error('\n❌ ERROR FATAL E14.4-A:');
    console.error(error);
    process.exitCode = 1;
});