/**
 * @fileoverview scripts/diagnosticos/test-epub-compiler.js
 *
 * E15.1-A — Regresión mínima del orquestador EPUB.
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const { compilarEPUB } = require('../../src/empaquetador/EpubCompiler');

async function assertExiste(filePath, descripcion) {
    try {
        await fs.access(filePath);
    } catch {
        throw new Error(`${descripcion}: ${filePath}`);
    }
}

async function ejecutarPruebasE15_1() {
    console.log('============================================================');
    console.log('  [E15.1-A] REGRESIÓN DEL ORQUESTADOR EPUB');
    console.log('============================================================\n');

    const tempDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'lexmotor-e15-1-')
    );

    const sourceDir = path.join(tempDir, 'source');
    const stagingDir = path.join(tempDir, 'staging');
    const outputPath = path.join(tempDir, 'output', 'prueba-e15.epub');

    const xhtmlPath = path.join(sourceDir, 'export.xhtml');
    const cssPath = path.join(sourceDir, 'fragmento.css');

    try {
        await fs.mkdir(sourceDir, { recursive: true });

        // ============================================================
        // 1. Fuentes físicas mínimas
        // ============================================================

        await fs.writeFile(
            xhtmlPath,
            `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Prueba E15</title>
</head>
<body>
    <h1 class="titulo">Prueba E15</h1>
</body>
</html>`,
            'utf8'
        );

        await fs.writeFile(
            cssPath,
            `.titulo {
    color: #000000;
    text-align: center;
}`,
            'utf8'
        );

        // ============================================================
        // 2. Inventario declarativo (Incluyendo nav.xhtml obligatorio)
        // ============================================================

        const manifestItems = [
            {
                id: 'content',
                href: 'Text/export.xhtml',
                mediaType: 'application/xhtml+xml'
            },
            {
                id: 'style',
                href: 'Styles/fragmento.css',
                mediaType: 'text/css'
            },
            {
                id: 'nav',
                href: 'nav.xhtml',
                mediaType: 'application/xhtml+xml',
                properties: 'nav'
            }
        ];

        const spineIds = [
            'content'
        ];

        const navigation = [
            {
                title: 'Prueba E15',
                href: 'Text/export.xhtml'
            }
        ];

        // ============================================================
        // 3. EJECUCIÓN — HAPPY PATH
        // ============================================================

        const resultado = await compilarEPUB({
            xhtmlPath,
            cssPath,
            assetsDir: null,
            stagingDir,
            outputPath,

            metadata: {
                title: 'Prueba E15',
                language: 'es-CO',
                identifier: 'urn:uuid:e15-test-0001',
                creator: 'LexDigitalHD'
            },

            manifestItems,
            spineIds,
            navigation
        });

        // ============================================================
        // INVARIANTE 1 — Contrato de éxito
        // ============================================================

        if (resultado.success !== true) {
            throw new Error(
                `E15.1-A: compilación debería ser exitosa.\n` +
                JSON.stringify(resultado, null, 2)
            );
        }

        console.log(
            '✅ Invariante 1: compilarEPUB() devuelve success=true.'
        );

        // ============================================================
        // INVARIANTE 2 — Validación E14.4 integrada
        // ============================================================

        if (
            !resultado.validation ||
            resultado.validation.valid !== true
        ) {
            throw new Error(
                'E15.1-A: validation.valid debería ser true.'
            );
        }

        console.log(
            '✅ Invariante 2: E14.4 devuelve validation.valid=true.'
        );

        // ============================================================
        // INVARIANTE 3 — Contrato package
        // ============================================================

        if (
            !resultado.package ||
            typeof resultado.package.bytes !== 'number' ||
            typeof resultado.package.entries !== 'number'
        ) {
            throw new Error(
                'E15.1-A: contrato package incompleto.'
            );
        }

        if (resultado.package.bytes <= 0) {
            throw new Error(
                'E15.1-A: el EPUB generado tiene tamaño inválido.'
            );
        }

        if (resultado.package.entries <= 0) {
            throw new Error(
                'E15.1-A: el EPUB no contiene entradas.'
            );
        }

        console.log(
            '✅ Invariante 3: contrato package estable y consistente.'
        );

        // ============================================================
        // INVARIANTE 4 — EPUB físico
        // ============================================================

        await assertExiste(
            outputPath,
            'El EPUB final no fue generado'
        );

        console.log(
            '✅ Invariante 4: archivo .epub generado físicamente.'
        );

        // ============================================================
        // INVARIANTE 5 — Staging físico
        // ============================================================

        await assertExiste(
            path.join(stagingDir, 'mimetype'),
            'Falta mimetype'
        );

        await assertExiste(
            path.join(stagingDir, 'META-INF', 'container.xml'),
            'Falta container.xml'
        );

        await assertExiste(
            path.join(stagingDir, 'OEBPS', 'content.opf'),
            'Falta content.opf'
        );

        console.log(
            '✅ Invariante 5: staging OCF conservado para inspección.'
        );

        // ============================================================
        // INVARIANTE 6 — La ruta devuelta coincide con la solicitada
        // ============================================================

        if (resultado.outputPath !== outputPath) {
            throw new Error(
                'E15.1-A: outputPath devuelto no coincide con el solicitado.'
            );
        }

        console.log(
            '✅ Invariante 6: outputPath respeta el contrato.'
        );

        // ============================================================
        // 4. PRUEBA NEGATIVA (Manifiesto inválido)
        // ============================================================

        const invalidStagingDir = path.join(
            tempDir,
            'staging-invalid'
        );

        const invalidOutputPath = path.join(
            tempDir,
            'output',
            'debe-no-existir.epub'
        );

        const resultadoInvalido = await compilarEPUB({
            xhtmlPath,
            cssPath,
            assetsDir: null,
            stagingDir: invalidStagingDir,
            outputPath: invalidOutputPath,

            metadata: {
                title: 'Prueba negativa E15',
                language: 'es-CO',
                identifier: 'urn:uuid:e15-invalid-0001',
                creator: 'LexDigitalHD'
            },

            manifestItems: [
                {
                    id: 'fantasma',
                    href: 'Text/no-existe.xhtml',
                    mediaType: 'application/xhtml+xml'
                }
            ],

            spineIds: [
                'fantasma'
            ],

            navigation: []
        });

        // ============================================================
        // INVARIANTE 7 — Fallo estructural bloquea E14.5
        // ============================================================

        if (resultadoInvalido.success !== false) {
            throw new Error(
                'E15.1-A: un staging inválido no puede producir success=true.'
            );
        }

        if (
            !resultadoInvalido.validation ||
            resultadoInvalido.validation.valid !== false
        ) {
            throw new Error(
                'E15.1-A: staging inválido debería devolver validation.valid=false.'
            );
        }

        console.log(
            '✅ Invariante 7: E14.4 bloquea correctamente el empaquetamiento inválido.'
        );

        // ============================================================
        // INVARIANTE 8 — No debe existir EPUB tras el rechazo
        // ============================================================

        let epubExisteTrasFallo = true;

        try {
            await fs.access(invalidOutputPath);
        } catch {
            epubExisteTrasFallo = false;
        }

        if (epubExisteTrasFallo) {
            throw new Error(
                'E15.1-A: se generó un EPUB pese al fallo de validación.'
            );
        }

        console.log(
            '✅ Invariante 8: ningún EPUB inválido fue producido.'
        );

        console.log('\n============================================================');
        console.log('  🟢 E15.1-A APROBADA');
        console.log('============================================================\n');

    } catch (error) {
        console.error('\n❌ E15.1-A FALLÓ:\n');
        console.error(error);
        process.exitCode = 1;

    } finally {
        await fs.rm(tempDir, {
            recursive: true,
            force: true
        });
    }
}

ejecutarPruebasE15_1();