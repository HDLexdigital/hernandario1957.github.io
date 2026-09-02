/**
 * @fileoverview test/integration/e15.4-epubcheck.test.js
 *
 * E15.4-A — Auditoría de Conformidad Estricta con EPUBCheck 5.3.0 (Congelado)
 * Garantiza que el pipeline End-to-End produzca EPUBs con 0 errores y 0 warnings.
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);

const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { ensamblarDocumentoXHTML } = require('../../src/constructores/ensambladorDocumento');
const { compilarEPUB } = require('../../src/empaquetador/EpubCompiler');

describe('E15.4-A — Certificación EPUBCheck 5.3.0', () => {
    let tempDir, outputPath;
    let epubCheckReport = { exitCode: null, stdout: '', stderr: '' };

    beforeAll(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lexmotor-e15.4-'));
        const stagingDir = path.join(tempDir, 'staging');
        const outputDir = path.join(tempDir, 'output');
        outputPath = path.join(outputDir, 'constitucion-certificacion.epub');
        await fs.mkdir(outputDir, { recursive: true });

        const textDir = path.join(tempDir, 'source/Text');
        const stylesDir = path.join(tempDir, 'source/Styles');
        await fs.mkdir(textDir, { recursive: true });
        await fs.mkdir(stylesDir, { recursive: true });

        const xhtmlPath = path.join(textDir, 'export.xhtml');
        const cssPath = path.join(stylesDir, 'fragmento.css');

        const fixturesDir = path.resolve(__dirname, '../fixtures');
        const jsonCrudo = JSON.parse(await fs.readFile(path.join(fixturesDir, 'input_req-uxp-1787138010552.json'), 'utf8'));
        const cssReal = await fs.readFile(path.join(fixturesDir, 'fragmento.css'), 'utf8');

        // 1. Pipeline Productivo
        const resultadoAdaptador = adaptarInDesign({ jsonCrudo, semanticMap: { styles: [] } });
        const resultadoCore = compilarLexmotor(resultadoAdaptador.ast, {});
        const xhtmlFinal = ensamblarDocumentoXHTML(resultadoCore.xhtml, {
            title: 'Constitución Política',
            cssName: '../Styles/fragmento.css',
            lang: 'es-CO'
        });

        await fs.writeFile(xhtmlPath, xhtmlFinal, 'utf8');
        await fs.writeFile(cssPath, cssReal, 'utf8');

        // 2. Empaquetado OCF
        await compilarEPUB({
            xhtmlPath,
            cssPath,
            assetsDir: null,
            stagingDir,
            outputPath,
            metadata: { 
                title: 'Constitución Política', 
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

        // 3. Auditoría Externa EPUBCheck 5.3.0
        try {
            const jarPath = process.env.EPUBCHECK_JAR || path.resolve(__dirname, '../../tools/epubcheck/epubcheck.jar');
            const javaRes = await execFileAsync('java', ['-jar', jarPath, outputPath]);
            epubCheckReport.exitCode = 0;
            epubCheckReport.stdout = javaRes.stdout;
            epubCheckReport.stderr = javaRes.stderr;
        } catch (error) {
            epubCheckReport.exitCode = error.code !== undefined ? error.code : 1;
            epubCheckReport.stdout = error.stdout || '';
            epubCheckReport.stderr = error.stderr || error.message;
        }
    }, 45000);

    afterAll(async () => {
        try { await fs.rm(tempDir, { recursive: true, force: true }); } catch (e) {}
    });

    test('D1: El EPUB fue generado físicamente (Frontera FileSystem)', async () => {
        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(0);
    });

    test('D2: Certificación W3C/IDPF — 0 Errores, 0 Advertencias (Exit Code 0)', () => {
        expect(epubCheckReport.exitCode).toBe(0);
        // Aseguramos que la consola estándar confirme "0 errores"
        expect(epubCheckReport.stdout).toMatch(/0 errores fatales \/ 0 errores \/ 0 advertencias/i);
    });
});