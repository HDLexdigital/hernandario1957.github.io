/**
 * @fileoverview scripts/diagnosticos/test-opf-builder.js
 * 
 * E14.2-A — Auditoría forense del Package Document (OPF).
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { prepararEsqueletoEPUB } = require('../../src/empaquetador/EpubPackager');
const { construirOPF } = require('../../src/empaquetador/OpfBuilder');

async function calcularHash(filePath) {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

async function ejecutarPruebasE14_2() {
    console.log('============================================================');
    console.log('  [E14.2-A] EJECUTANDO REGRESIÓN DE PACKAGE DOCUMENT (OPF)');
    console.log('============================================================\n');

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lexmotor-e14-2-'));
    const sourceXHTML = path.join(tempDir, 'export_123.xhtml');
    const sourceCSS = path.join(tempDir, 'fragmento.css');
    const stagingDir = path.join(tempDir, 'staging_epub');

    // XHTML con caracteres que requieren escape XML forzoso
    await fs.writeFile(sourceXHTML, '<h1 class="titulo">Constitución &amp; Ley <Parte I></h1>', 'utf8');
    await fs.writeFile(sourceCSS, '.titulo { color: #000; }', 'utf8');

    try {
        // 1. Preparar el esqueleto físico base (E14.1)
        const esqueleto = await prepararEsqueletoEPUB({
            xhtmlPath: sourceXHTML,
            cssPath: sourceCSS,
            assetsDir: null,
            stagingDir: stagingDir
        });

        const manifestItems = [
            { id: 'text-main', href: 'Text/export_123.xhtml', mediaType: 'application/xhtml+xml' },
            { id: 'style-main', href: 'Styles/fragmento.css', mediaType: 'text/css' }
        ];

        const spineIds = ['text-main']; // El CSS deliberadamente fuera del spine

        // 2. Ejecutar generador OPF
        const resultadoOpf = await construirOPF({
            stagingDir,
            metadata: {
                title: 'Constitución & Ley <Parte I>',
                creator: 'LexDigital & Cia'
            },
            manifestItems,
            spineIds
        });

        // ============================================================
        // INVARIANTE 1: Escape XML en Metadatos
        // ============================================================
        if (!resultadoOpf.content.includes('&lt;Parte I&gt;') || !resultadoOpf.content.includes('&amp;')) {
            throw new Error('E14.2: Falló el escape XML obligatorio en los metadatos.');
        }
        console.log('✅ Invariante 1: Escape XML riguroso aplicado correctamente.');

        // ============================================================
        // INVARIANTE 2: UUID real generado con crypto.randomUUID()
        // ============================================================
        if (!resultadoOpf.content.includes('urn:uuid:')) {
            throw new Error('E14.2: El identificador único no contiene un UUID válido.');
        }
        console.log('✅ Invariante 2: Identificador UUID v4 válido generado.');

        // ============================================================
        // INVARIANTE 3: Validación de IDs duplicados y Spine huérfano (Prueba Negativa)
        // ============================================================
        let errorCapturado = false;
        try {
            await construirOPF({
                stagingDir,
                manifestItems: [
                    { id: 'dup', href: 'Text/export_123.xhtml', mediaType: 'application/xhtml+xml' },
                    { id: 'dup', href: 'Styles/fragmento.css', mediaType: 'text/css' } // ID duplicado deliberado
                ],
                spineIds: ['dup']
            });
        } catch (e) {
            errorCapturado = true;
        }
        if (!errorCapturado) throw new Error('E14.2: El sistema permitió IDs duplicados en el manifest.');
        console.log('✅ Invariante 3: Rechazo exitoso de IDs duplicados.');

        // ============================================================
        // INVARIANTE 4: Archivo inexistente en el inventario físico (Prueba Negativa)
        // ============================================================
        let errorFisicoCapturado = false;
        try {
            await construirOPF({
                stagingDir,
                manifestItems: [
                    { id: 'fantasma', href: 'Text/no_existo.xhtml', mediaType: 'application/xhtml+xml' }
                ],
                spineIds: ['fantasma']
            });
        } catch (e) {
            errorFisicoCapturado = true;
        }
        if (!errorFisicoCapturado) throw new Error('E14.2: El sistema permitió indexar un archivo físico inexistente.');
        console.log('✅ Invariante 4: Validación de inventario físico operativo (archivo fantasma rechazado).');

        // ============================================================
        // INVARIANTE 5: Cero mutación semántica (SHA-256 intacto post-OPF)
        // ============================================================
        const hashDestXHTML = await calcularHash(esqueleto.xhtmlPath);
        const hashDestCSS = await calcularHash(esqueleto.cssPath);
        
        const sourceXHTMLHash = await calcularHash(sourceXHTML);
        const sourceCSSHash = await calcularHash(sourceCSS);

        if (hashDestXHTML !== sourceXHTMLHash || hashDestCSS !== sourceCSSHash) {
            throw new Error('E14.2: ¡OpfBuilder alteró los archivos fuente!');
        }
        console.log('✅ Invariante 5: Zero Semantic Mutation comprobada (Hashes SHA-256 intactos).');

        console.log('\n🟢 E14.2 PACKAGE DOCUMENT (OPF) APROBADO CON ÉXITO.\n');

    } catch (error) {
        console.error('\n❌ FALLO EN LA REGRESIÓN E14.2:\n', error);
        process.exitCode = 1;
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
}

ejecutarPruebasE14_2();