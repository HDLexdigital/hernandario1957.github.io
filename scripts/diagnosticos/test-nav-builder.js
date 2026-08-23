/**
 * @fileoverview scripts/diagnosticos/test-nav-builder.js
 * 
 * E14.3-A — Auditoría forense del Navigation Document (nav.xhtml).
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { prepararEsqueletoEPUB } = require('../../src/empaquetador/EpubPackager');
const { construirNavegacion } = require('../../src/empaquetador/NavBuilder');

async function calcularHash(filePath) {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

async function ejecutarPruebasE14_3() {
    console.log('============================================================');
    console.log('  [E14.3-A] EJECUTANDO REGRESIÓN DE NAVIGATION DOCUMENT (NAV)');
    console.log('============================================================\n');

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lexmotor-e14-3-'));
    const sourceXHTML = path.join(tempDir, 'export_123.xhtml');
    const sourceCSS = path.join(tempDir, 'fragmento.css');
    const stagingDir = path.join(tempDir, 'staging_epub');

    await fs.writeFile(sourceXHTML, '<h1 id="titulo-i">Título I</h1>', 'utf8');
    await fs.writeFile(sourceCSS, '.titulo { color: blue; }', 'utf8');

    try {
        // 1. Preparar esqueleto físico (E14.1)
        const esqueleto = await prepararEsqueletoEPUB({
            xhtmlPath: sourceXHTML,
            cssPath: sourceCSS,
            assetsDir: null,
            stagingDir: stagingDir
        });

        const hashOriginalXHTML = await calcularHash(esqueleto.xhtmlPath);
        const hashOriginalCSS = await calcularHash(esqueleto.cssPath);

        const navItemsValidos = [
            { title: 'Título I & Principios <Fundamentales>', href: 'Text/export_123.xhtml#titulo-i' }
        ];

        // 2. Ejecutar generador de navegación
        const resultadoNav = await construirNavegacion({
            stagingDir,
            navItems: navItemsValidos
        });

        const contenidoNav = resultadoNav.content;

        // ============================================================
        // INVARIANTE 1 & 2: Namespace XHTML y EPUB declarados
        // ============================================================
        if (!contenidoNav.includes('xmlns="http://www.w3.org/1999/xhtml"') || 
            !contenidoNav.includes('xmlns:epub="http://www.idpf.org/2007/ops"')) {
            throw new Error('E14.3: Faltan los namespaces obligatorios de XHTML o EPUB en nav.xhtml.');
        }
        console.log('✅ Invariantes 1 & 2: Namespaces XHTML y EPUB correctamente declarados.');

        // ============================================================
        // INVARIANTE 3 & 4: Estructura nav[epub:type="toc"] y ol > li > a
        // ============================================================
        if (!contenidoNav.includes('epub:type="toc"') || !contenidoNav.includes('<ol>') || !contenidoNav.includes('<li>') || !contenidoNav.includes('<a href=')) {
            throw new Error('E14.3: Estructura TOC obligatoria ausente en nav.xhtml.');
        }
        console.log('✅ Invariantes 3 & 4: Estructura semántica TOC con <nav>, <ol>, <li> y <a> validada.');

        // ============================================================
        // INVARIANTE 5, 6 & 7: Conservación y Escape XML de Títulos y Hrefs
        // ============================================================
        if (!contenidoNav.includes('Título I &amp; Principios &lt;Fundamentales&gt;') ||
            !contenidoNav.includes('href="Text/export_123.xhtml#titulo-i"')) {
            throw new Error('E14.3: Falló el escape XML o la persistencia exacta de los datos de navegación.');
        }
        console.log('✅ Invariantes 5, 6 & 7: Contenido conservado y escape XML riguroso verificado.');

        // ============================================================
        // INVARIANTE 8: Rechazo de entradas inválidas (Pruebas Negativas de Seguridad)
        // ============================================================
        let errorFaltante = false;
        try {
            await construirNavegacion({ stagingDir, navItems: [{ href: 'Text/foo.xhtml' }] }); // Falta title
        } catch (e) {
            errorFaltante = true;
        }
        if (!errorFaltante) throw new Error('E14.3: El sistema permitió construir navegación sin el campo "title".');

        let errorUrlAbsoluta = false;
        try {
            await construirNavegacion({ stagingDir, navItems: [{ title: 'Malicioso', href: 'https://evil.com' }] });
        } catch (e) {
            errorUrlAbsoluta = true;
        }
        if (!errorUrlAbsoluta) throw new Error('E14.3: El sistema permitió una URL absoluta externa.');

        let errorTraversal = false;
        try {
            await construirNavegacion({ stagingDir, navItems: [{ title: 'Traversal', href: '../fuera.xhtml' }] });
        } catch (e) {
            errorTraversal = true;
        }
        if (!errorTraversal) throw new Error('E14.3: El sistema permitió path traversal hacia fuera de OEBPS.');

        console.log('✅ Invariante 8: Pruebas negativas de seguridad superadas con éxito (rechazo de datos corruptos/maliciosos).');

        // ============================================================
        // INVARIANTE 9 & 10: nav.xhtml no modifica XHTML ni CSS previos
        // ============================================================
        const hashNuevoXHTML = await calcularHash(esqueleto.xhtmlPath);
        const hashNuevoCSS = await calcularHash(esqueleto.cssPath);

        if (hashOriginalXHTML !== hashNuevoXHTML || hashOriginalCSS !== hashNuevoCSS) {
            throw new Error('E14.3: ¡NavBuilder alteró los archivos XHTML o CSS del staging!');
        }
        console.log('✅ Invariantes 9 & 10: Zero Semantic Mutation garantizada (Hashes SHA-256 de XHTML y CSS intactos).');

        console.log('\n🟢 E14.3 NAVIGATION DOCUMENT (NAV) APROBADO CON ÉXITO.\n');

    } catch (error) {
        console.error('\n❌ FALLO EN LA REGRESIÓN E14.3:\n', error);
        process.exitCode = 1;
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
}

ejecutarPruebasE14_3();