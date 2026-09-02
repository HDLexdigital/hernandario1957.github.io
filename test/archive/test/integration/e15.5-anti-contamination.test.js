/**
 * @fileoverview test/integration/e15.5-anti-contamination.test.js
 *
 * E15.5-A — Contrato de Aislamiento Manifest-Driven
 * 
 * Invariante: 
 *   MANIFEST = autoridad declarativa
 *   ZIP      = realización física
 *   Todo recurso en el ZIP debe estar declarado.
 *   Ningún recurso físico no declarado debe entrar al ZIP.
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const AdmZip = require('adm-zip');

const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { ensamblarDocumentoXHTML } = require('../../src/constructores/ensambladorDocumento');
const { compilarEPUB } = require('../../src/empaquetador/EpubCompiler');

describe('E15.5-A — Aislamiento Físico y Empaquetado Manifest-Driven', () => {
    let tempDir, stagingDir, outputPath;
    let fantasmaPath;
    let zipEntries = [];
    let xhtmlOriginalContent = '';

    beforeAll(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lexmotor-e15.5-'));
        stagingDir = path.join(tempDir, 'staging');
        const outputDir = path.join(tempDir, 'output');
        outputPath = path.join(outputDir, 'constitucion-anticontaminacion.epub');
        await fs.mkdir(outputDir, { recursive: true });

        const textDir = path.join(tempDir, 'source/Text');
        const stylesDir = path.join(tempDir, 'source/Styles');
        await fs.mkdir(textDir, { recursive: true });
        await fs.mkdir(stylesDir, { recursive: true });

        const xhtmlPath = path.join(textDir, 'export.xhtml');
        const cssPath = path.join(stylesDir, 'fragmento.css');

        // 1. Carga del Corpus Real
        const fixturesDir = path.resolve(__dirname, '../fixtures');
        const jsonCrudo = JSON.parse(await fs.readFile(path.join(fixturesDir, 'input_req-uxp-1787138010552.json'), 'utf8'));
        const cssReal = await fs.readFile(path.join(fixturesDir, 'fragmento.css'), 'utf8');

        // 2. Compilación Productiva
        const resultadoAdaptador = adaptarInDesign({ jsonCrudo, semanticMap: { styles: [] } });
        const resultadoCore = compilarLexmotor(resultadoAdaptador.ast, {});
        xhtmlOriginalContent = ensamblarDocumentoXHTML(resultadoCore.xhtml, {
            title: 'Constitución Política',
            cssName: '../Styles/fragmento.css',
            lang: 'es-CO'
        });

        await fs.writeFile(xhtmlPath, xhtmlOriginalContent, 'utf8');
        await fs.writeFile(cssPath, cssReal, 'utf8');

        // 3. Inyección de Contaminación Física en el Staging
        // Creamos el staging y la estructura OEBPS de antemano para depositar el archivo fantasma
        const stagingTextDir = path.join(stagingDir, 'OEBPS/Text');
        await fs.mkdir(stagingTextDir, { recursive: true });
        
        fantasmaPath = path.join(stagingTextDir, 'fantasma.txt');
        await fs.writeFile(fantasmaPath, 'ARCHIVO CONTAMINANTE DELIBERADO - NO DECLARADO', 'utf8');

        // 4. Empaquetado OCF (EpubCompiler lee el staging, genera el OPF y llama a EpubPackager)
        await compilarEPUB({
            xhtmlPath,
            cssPath,
            assetsDir: null,
            stagingDir,
            outputPath,
            metadata: { 
                title: 'Constitución (Anti-Contaminación)', 
                language: 'es-CO', 
                identifier: `urn:uuid:${crypto.randomUUID()}` 
            },
            manifestItems: [
                { id: 'content', href: 'Text/export.xhtml', mediaType: 'application/xhtml+xml' },
                { id: 'style', href: 'Styles/fragmento.css', mediaType: 'text/css' },
                { id: 'nav', href: 'nav.xhtml', mediaType: 'application/xhtml+xml', properties: 'nav' }
            ],
            spineIds: ['content'],
            navigation: [{ title: 'Inicio', href: 'Text/export.xhtml' }]
        });

        // 5. Auditoría Independiente del ZIP resultante
        const zip = new AdmZip(outputPath);
        zipEntries = zip.getEntries().map(entry => entry.entryName);
    });

    afterAll(async () => {
        try { await fs.rm(tempDir, { recursive: true, force: true }); } catch (e) {}
    });

    test('E15.5-A.3: El archivo fantasma existe físicamente en el staging', async () => {
        // Garantiza que la prueba es válida y la contaminación fue inyectada exitosamente antes del ZIP
        const stat = await fs.stat(fantasmaPath);
        expect(stat.isFile()).toBe(true);
    });

    test('E15.5-A.1: El recurso declarado export.xhtml está en el ZIP', () => {
        expect(zipEntries).toContain('OEBPS/Text/export.xhtml');
    });

    test('E15.5-A.2: El recurso declarado nav.xhtml está en el ZIP', () => {
        expect(zipEntries).toContain('OEBPS/nav.xhtml');
    });

    test('E15.5-A.4: FRONTERA BLINDADA — fantasma.txt NO existe en el ZIP', () => {
        // La validación principal del Manifest-Driven approach
        expect(zipEntries).not.toContain('OEBPS/Text/fantasma.txt');
    });

    test('E15.5-A.5: La contaminación no corrompe la integridad de los recursos declarados', () => {
        // Validamos que el recurso que sí entró al ZIP se mantuvo inalterado
        const zip = new AdmZip(outputPath);
        const xhtmlEntry = zip.getEntry('OEBPS/Text/export.xhtml');
        const xhtmlRecuperado = xhtmlEntry.getData().toString('utf8');
        
        expect(xhtmlRecuperado).toEqual(xhtmlOriginalContent);
    });
});