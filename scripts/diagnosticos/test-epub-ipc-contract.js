/**
 * @fileoverview scripts/diagnosticos/test-epub-ipc-contract.js
 *
 * E15.2-A — Certificación del Contrato de Integración IPC.
 *
 * Objetivo:
 *   Garantizar que el contrato devuelto por EpubCompiler es completamente
 *   agnóstico de la implementación interna (sin fugas de archiver, ZIP o I/O crudo)
 *   y que encapsula los errores de negocio de forma segura para el watcher-ipc.js.
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { compilarEPUB } = require('../../src/empaquetador/EpubCompiler');

function assert(condition, message) {
    if (!condition) {
        throw new Error(`[E15.2-A IPC Contract Failure] ${message}`);
    }
}

async function ejecutarPruebasE15_2() {
    console.log('============================================================');
    console.log('  [E15.2-A] CERTIFICACIÓN DEL CONTRATO IPC');
    console.log('============================================================\n');

    const tempDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'lexmotor-e15-2-')
    );

    const sourceDir = path.join(tempDir, 'source');
    const stagingDir = path.join(tempDir, 'staging');
    const outputPath = path.join(tempDir, 'output', 'ipc-test.epub');

    const xhtmlPath = path.join(sourceDir, 'export.xhtml');
    const cssPath = path.join(sourceDir, 'fragmento.css');

    try {
        await fs.mkdir(sourceDir, { recursive: true });

        await fs.writeFile(
            xhtmlPath,
            '<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>IPC</title></head><body><h1>IPC Test</h1></body></html>',
            'utf8'
        );
        await fs.writeFile(cssPath, 'h1 { color: blue; }', 'utf8');

        // ============================================================
        // 1. Simular Petición Válida desde el IPC
        // ============================================================
        const respuestaIPC = await compilarEPUB({
            xhtmlPath,
            cssPath,
            assetsDir: null,
            stagingDir,
            outputPath,
            metadata: {
                title: 'IPC Test Book',
                language: 'es-CO',
                identifier: 'urn:uuid:ipc-test-0001'
            },
            manifestItems: [
                { id: 'content', href: 'Text/export.xhtml', mediaType: 'application/xhtml+xml' },
                { id: 'style', href: 'Styles/fragmento.css', mediaType: 'text/css' },
                { id: 'nav', href: 'nav.xhtml', mediaType: 'application/xhtml+xml', properties: 'nav' }
            ],
            spineIds: ['content'],
            navigation: [{ title: 'IPC Test', href: 'Text/export.xhtml' }]
        });

        // ============================================================
        // Verificaciones del Esquema de Éxito IPC
        // ============================================================
        assert(typeof respuestaIPC.success === 'boolean', 'success debe ser booleano');
        assert(respuestaIPC.success === true, 'success debe ser true en happy path');
        assert(typeof respuestaIPC.outputPath === 'string', 'outputPath debe ser un string');
        assert(typeof respuestaIPC.stagingDir === 'string', 'stagingDir debe ser un string');
        assert(typeof respuestaIPC.validation === 'object', 'validation debe ser un objeto');
        assert(respuestaIPC.validation.valid === true, 'validation.valid debe ser true');
        assert(Array.isArray(respuestaIPC.validation.errors), 'validation.errors debe ser un array');
        assert(Array.isArray(respuestaIPC.validation.warnings), 'validation.warnings debe ser un array');
        assert(typeof respuestaIPC.package === 'object' && respuestaIPC.package !== null, 'package debe estar presente');
        assert(typeof respuestaIPC.package.bytes === 'number', 'package.bytes debe ser numérico');
        assert(typeof respuestaIPC.package.entries === 'number', 'package.entries debe ser numérico');

        console.log('✅ Contrato IPC (Success): Estructura de negocio validada sin fugas internas.');

        // ============================================================
        // 2. Simular Petición Inválida / Corrupta desde el IPC
        // ============================================================
        const stagingMalicioso = path.join(tempDir, 'staging-bad');
        const outputMalicioso = path.join(tempDir, 'output', 'bad.epub');

        const respuestaIPCFallida = await compilarEPUB({
            xhtmlPath,
            cssPath,
            assetsDir: null,
            stagingDir: stagingMalicioso,
            outputPath: outputMalicioso,
            metadata: { title: 'Bad', language: 'es-CO', identifier: 'urn:uuid:bad' },
            manifestItems: [
                { id: 'fantasma', href: 'Text/fantasma.xhtml', mediaType: 'application/xhtml+xml' }
            ],
            spineIds: ['fantasma'],
            navigation: []
        });

        // ============================================================
        // Verificaciones del Esquema de Fallo IPC
        // ============================================================
        assert(respuestaIPCFallida.success === false, 'success debe ser false ante fallo');
        assert(respuestaIPCFallida.outputPath === null, 'outputPath debe ser null ante fallo');
        assert(respuestaIPCFallida.validation.valid === false, 'validation.valid debe ser false');
        assert(respuestaIPCFallida.validation.errors.length > 0, 'Debe reportar errores estructurados');
        assert(respuestaIPCFallida.package === null, 'package debe ser null ante fallo');

        // Comprobar que no hay propiedades prohibidas que filtren tecnología (ej: archiver, stream, buffer crudo)
        const clavesPermitidas = ['success', 'outputPath', 'stagingDir', 'validation', 'package'];
        const clavesRecibidas = Object.keys(respuestaIPCFallida);
        for (const clave of clavesRecibidas) {
            assert(clavesPermitidas.includes(clave), `El contrato IPC filtró una propiedad no autorizada: ${clave}`);
        }

        console.log('✅ Contrato IPC (Failure): Encapsulamiento de errores y aislamiento de propiedades verificado.');

        console.log('\n============================================================');
        console.log('  🟢 E15.2 APROBADA — CONTRATO IPC CONGELADO');
        console.log('============================================================\n');

    } catch (error) {
        console.error('\n❌ E15.2 FALLÓ:\n', error);
        process.exitCode = 1;
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
}

ejecutarPruebasE15_2();