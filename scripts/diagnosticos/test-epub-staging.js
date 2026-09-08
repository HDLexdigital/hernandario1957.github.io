/**
 * @fileoverview scripts/diagnosticos/test-epub-staging.js
 * 
 * E14.1-A — Auditoría forense del Staging OCF.
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { prepararEsqueletoEPUB, MIME_TYPE } = require('../../src/empaquetador/EpubPackager');

async function calcularHash(filePath) {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

async function ejecutarPruebasE14_1() {
    console.log('============================================================');
    console.log('  [E14.1-A] EJECUTANDO REGRESIÓN DE STAGING FÍSICO OCF');
    console.log('============================================================\n');

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lexmotor-e14-'));
    const sourceXHTML = path.join(tempDir, 'export_dummy.xhtml');
    const sourceCSS = path.join(tempDir, 'fragmento.css');
    const stagingDir = path.join(tempDir, 'staging_epub');

    await fs.writeFile(sourceXHTML, '<h1 class="titulo">Prueba E14</h1>', 'utf8');
    await fs.writeFile(sourceCSS, '.titulo { color: red; }', 'utf8');

    try {
        const resultado = await prepararEsqueletoEPUB({
            xhtmlPath: sourceXHTML,
            cssPath: sourceCSS,
            assetsDir: null,
            stagingDir: stagingDir
        });

        // 1. Mimetype estricto
        const mimetypeContent = await fs.readFile(resultado.mimetypePath, 'utf8');
        if (mimetypeContent !== MIME_TYPE) throw new Error('Mimetype difiere del estándar.');
        if (mimetypeContent.endsWith('\n') || mimetypeContent.endsWith('\r')) {
            throw new Error('Mimetype contiene saltos de línea (Violación EPUB3).');
        }
        console.log('✅ Invariante 1: mimetype estricto y sin saltos de línea.');

        // 2. container.xml apunta a content.opf
        const containerContent = await fs.readFile(resultado.containerPath, 'utf8');
        if (!containerContent.includes('full-path="OEBPS/content.opf"')) {
            throw new Error('container.xml no apunta a OEBPS/content.opf');
        }
        console.log('✅ Invariante 2: container.xml direcciona correctamente al OPF.');

        // 3 & 4. Zero Semantic Mutation
        const hashSourceXHTML = await calcularHash(sourceXHTML);
        const hashDestXHTML = await calcularHash(resultado.xhtmlPath);
        if (hashSourceXHTML !== hashDestXHTML) throw new Error('Mutación detectada en XHTML.');
        console.log('✅ Invariante 3: Integridad XHTML garantizada (SHA-256 idéntico).');
        
        const hashSourceCSS = await calcularHash(sourceCSS);
        const hashDestCSS = await calcularHash(resultado.cssPath);
        if (hashSourceCSS !== hashDestCSS) throw new Error('Mutación detectada en CSS.');
        console.log('✅ Invariante 4: Integridad CSS garantizada (SHA-256 idéntico).');

        console.log('\n🟢 E14.1 STAGING FÍSICO APROBADO CON ÉXITO.\n');

    } catch (error) {
        console.error('\n❌ FALLO EN LA REGRESIÓN E14.1:\n', error);
        // Evita falsos positivos en CI/CD
        process.exitCode = 1; 
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
}

ejecutarPruebasE14_1();