/**
 * @fileoverview scripts/diagnosticos/test-epub-packager.js
 *
 * E14.5-A — Auditoría binaria del EPUB OCF.
 *
 * Invariantes:
 *   1. mimetype es la primera entrada.
 *   2. mimetype utiliza STORE.
 *   3. Todos los recursos declarados están presentes.
 *   4. Los recursos huérfanos no son empaquetados.
 *   5. SHA-256 del contenido extraído = SHA-256 del staging.
 *   6. Staging inválido bloquea el empaquetado.
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const AdmZip = require('adm-zip');

const {
    empaquetarEPUB
} = require('../../src/empaquetador/EpubPackager');

async function calcularHashBuffer(buffer) {
    return crypto
        .createHash('sha256')
        .update(buffer)
        .digest('hex');
}

async function calcularHashArchivo(filePath) {
    const buffer = await fs.readFile(filePath);
    return calcularHashBuffer(buffer);
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function ejecutarPruebasE14_5() {
    console.log('============================================================');
    console.log('  [E14.5-A] AUDITORÍA BINARIA DEL EMPAQUETADO EPUB OCF');
    console.log('============================================================\n');

    const tempDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'lexmotor-e14-5-')
    );

    const stagingDir = path.join(tempDir, 'staging');
    const outputPath = path.join(tempDir, 'resultado.epub');

    try {
        // --------------------------------------------------------
        // 1. Preparar staging mínimo válido
        // --------------------------------------------------------

        await fs.mkdir(
            path.join(stagingDir, 'META-INF'),
            { recursive: true }
        );

        await fs.mkdir(
            path.join(stagingDir, 'OEBPS', 'Text'),
            { recursive: true }
        );

        await fs.mkdir(
            path.join(stagingDir, 'OEBPS', 'Styles'),
            { recursive: true }
        );

        await fs.writeFile(
            path.join(stagingDir, 'mimetype'),
            'application/epub+zip',
            'utf8'
        );

        await fs.writeFile(
            path.join(stagingDir, 'META-INF', 'container.xml'),
            `<?xml version="1.0" encoding="UTF-8"?>
<container
    xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
    version="1.0">
  <rootfiles>
    <rootfile
        full-path="OEBPS/content.opf"
        media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
            'utf8'
        );

        const xhtml = '<h1 class="titulo">Prueba E14.5</h1>';
        const css = '.titulo { color: #ff0000; }';

        const xhtmlPath = path.join(
            stagingDir,
            'OEBPS',
            'Text',
            'export_test.xhtml'
        );

        const cssPath = path.join(
            stagingDir,
            'OEBPS',
            'Styles',
            'fragmento.css'
        );

        const navPath = path.join(
            stagingDir,
            'OEBPS',
            'Text',
            'nav.xhtml'
        );

        await fs.writeFile(xhtmlPath, xhtml, 'utf8');
        await fs.writeFile(cssPath, css, 'utf8');

        await fs.writeFile(
            navPath,
            `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Índice</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Índice</h1>
    <ol>
      <li>
        <a href="export_test.xhtml">Prueba E14.5</a>
      </li>
    </ol>
  </nav>
</body>
</html>`,
            'utf8'
        );

        // Archivo deliberadamente huérfano.
        const orphanPath = path.join(
            stagingDir,
            'OEBPS',
            'Text',
            'ARCHIVO_HUERFANO.tmp'
        );

        await fs.writeFile(
            orphanPath,
            'NO DEBE APARECER EN EL EPUB',
            'utf8'
        );

        // --------------------------------------------------------
        // 2. OPF
        // --------------------------------------------------------

        const opfPath = path.join(
            stagingDir,
            'OEBPS',
            'content.opf'
        );

        await fs.writeFile(
            opfPath,
            `<?xml version="1.0" encoding="UTF-8"?>
<package
    xmlns="http://www.idpf.org/2007/opf"
    version="3.0"
    unique-identifier="pub-id">

  <metadata
      xmlns:dc="http://purl.org/dc/elements/1.1/">

    <dc:identifier id="pub-id">
      urn:uuid:e1450000-0000-4000-8000-000000000001
    </dc:identifier>

    <dc:title>Prueba E14.5</dc:title>
    <dc:language>es-CO</dc:language>

    <meta property="dcterms:modified">
      2026-08-19T00:00:00Z
    </meta>

  </metadata>

  <manifest>
    <item
        id="content"
        href="Text/export_test.xhtml"
        media-type="application/xhtml+xml"/>

    <item
        id="nav"
        href="Text/nav.xhtml"
        media-type="application/xhtml+xml"
        properties="nav"/>

    <item
        id="css"
        href="Styles/fragmento.css"
        media-type="text/css"/>
  </manifest>

  <spine>
    <itemref idref="content"/>
  </spine>

</package>`,
            'utf8'
        );

        // --------------------------------------------------------
        // 3. Empaquetamiento
        // --------------------------------------------------------

        await empaquetarEPUB({
            stagingDir,
            outputPath
        });

        console.log(
            '✅ EPUB generado físicamente.'
        );

        // --------------------------------------------------------
        // 4. Abrir ZIP físico
        // --------------------------------------------------------

        const zip = new AdmZip(outputPath);
        const entries = zip.getEntries();

        assert(
            entries.length > 0,
            'El EPUB no contiene entradas.'
        );

        // --------------------------------------------------------
        // INVARIANTE 1
        // --------------------------------------------------------

        assert(
            entries[0].entryName === 'mimetype',
            `mimetype no es la primera entrada: ${entries[0].entryName}`
        );

        console.log(
            '✅ Invariante 1: mimetype es la primera entrada física.'
        );

        // --------------------------------------------------------
        // INVARIANTE 2
        // --------------------------------------------------------

        const mimetypeEntry = entries[0];

        /*
         * En ZIP:
         *   0 = STORE
         *   8 = DEFLATE
         */
        assert(
            mimetypeEntry.header.method === 0,
            `mimetype no utiliza STORE. Método: ${mimetypeEntry.header.method}`
        );

        console.log(
            '✅ Invariante 2: mimetype utiliza STORE (sin compresión).'
        );

        // --------------------------------------------------------
        // INVARIANTE 3
        // --------------------------------------------------------

        const mimetypeBuffer = mimetypeEntry.getData();

        assert(
            mimetypeBuffer.toString('utf8') === 'application/epub+zip',
            'Contenido de mimetype incorrecto.'
        );

        console.log(
            '✅ Invariante 3: contenido de mimetype exacto.'
        );

        // --------------------------------------------------------
        // INVARIANTE 4
        // --------------------------------------------------------

        const nombres = entries.map(entry => entry.entryName);

        const obligatorios = [
            'mimetype',
            'META-INF/container.xml',
            'OEBPS/content.opf',
            'OEBPS/Text/export_test.xhtml',
            'OEBPS/Text/nav.xhtml',
            'OEBPS/Styles/fragmento.css'
        ];

        for (const nombre of obligatorios) {
            assert(
                nombres.includes(nombre),
                `Falta entrada obligatoria: ${nombre}`
            );
        }

        console.log(
            '✅ Invariante 4: todos los recursos declarados están presentes.'
        );

        // --------------------------------------------------------
        // INVARIANTE 5
        // --------------------------------------------------------

        assert(
            !nombres.includes(
                'OEBPS/Text/ARCHIVO_HUERFANO.tmp'
            ),
            'Archivo huérfano fue empaquetado incorrectamente.'
        );

        console.log(
            '✅ Invariante 5: archivo huérfano excluido del EPUB.'
        );

        // --------------------------------------------------------
        // INVARIANTE 6 — Zero Semantic Mutation
        // --------------------------------------------------------

        const recursos = [
            {
                zip: 'OEBPS/Text/export_test.xhtml',
                source: xhtmlPath
            },
            {
                zip: 'OEBPS/Text/nav.xhtml',
                source: navPath
            },
            {
                zip: 'OEBPS/Styles/fragmento.css',
                source: cssPath
            }
        ];

        for (const recurso of recursos) {
            const entry = zip.getEntry(recurso.zip);

            assert(
                entry,
                `No se encontró ${recurso.zip} dentro del ZIP.`
            );

            const hashSource =
                await calcularHashArchivo(recurso.source);

            const hashZip =
                await calcularHashBuffer(entry.getData()); // ✅ Con await incorporado

            assert(
                hashSource === hashZip,
                `Mutación binaria detectada en ${recurso.zip}.`
            );
        }

        console.log(
            '✅ Invariante 6: Zero Semantic Mutation — SHA-256 idénticos.'
        );

        // --------------------------------------------------------
        // INVARIANTE 7 — Recursos comprimidos
        // --------------------------------------------------------

        for (const recurso of recursos) {
            const entry = zip.getEntry(recurso.zip);

            assert(
                entry.header.method === 8,
                `${recurso.zip} no utiliza DEFLATE.`
            );
        }

        console.log(
            '✅ Invariante 7: recursos OEBPS utilizan DEFLATE.'
        );

        console.log('\n============================================================');
        console.log('  🟢 E14.5-A APROBADA');
        console.log('============================================================\n');

    } catch (error) {
        console.error(
            '\n❌ FALLO EN LA REGRESIÓN E14.5-A:\n',
            error
        );

        process.exitCode = 1;

    } finally {
        await fs.rm(
            tempDir,
            {
                recursive: true,
                force: true
            }
        );
    }
}

ejecutarPruebasE14_5();