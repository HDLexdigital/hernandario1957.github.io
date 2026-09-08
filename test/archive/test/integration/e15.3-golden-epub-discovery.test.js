/**
 * @fileoverview test/integration/e15.3-golden-epub.test.js
 *
 * E15.3-A — Golden Test End-to-End Congelado (Pipeline EPUB3)
 * Certifica la invariancia estructural, semántica y binaria del corpus real.
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const AdmZip = require('adm-zip');

const { compilarEPUB } = require('../../src/empaquetador/EpubCompiler');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

async function calcularHashBuffer(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

describe('E15.3-A — Golden EPUB E2E (Baseline Congelado)', () => {
    let tempDir, stagingDir, outputDir, outputPath;
    let xhtmlSourcePath, cssSourcePath;

    let jsonCrudo;
    let cssReal;
    let resultadoAdaptador;
    let resultadoCore;
    let resultadoEpub;

    const metricasCapturadas = {
        nodosRaiz: 0,
        nodosTotales: 0,
        frecuenciasSemanticas: {},
        frecuenciasFisicas: {}
    };

    beforeAll(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lexmotor-e15-3-golden-'));
        const sourceDir = path.join(tempDir, 'source');
        stagingDir = path.join(tempDir, 'staging');
        outputDir = path.join(tempDir, 'output');
        outputPath = path.join(outputDir, 'constitucion-golden.epub');

        const textDir = path.join(sourceDir, 'Text');
        const stylesDir = path.join(sourceDir, 'Styles');
        await fs.mkdir(textDir, { recursive: true });
        await fs.mkdir(stylesDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });

        xhtmlSourcePath = path.join(textDir, 'export.xhtml');
        cssSourcePath = path.join(stylesDir, 'fragmento.css');

        const fixturesDir = path.resolve(__dirname, '../fixtures');
        await fs.mkdir(fixturesDir, { recursive: true });

        const jsonPath = path.join(fixturesDir, 'input_req-uxp-1787138010552.json');
        const cssPath = path.join(fixturesDir, 'fragmento.css');

        jsonCrudo = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
        cssReal = await fs.readFile(cssPath, 'utf8');

        // Ejecución del Pipeline Real
        resultadoAdaptador = adaptarInDesign({ jsonCrudo, semanticMap: { styles: [] } });
        resultadoCore = compilarLexmotor(resultadoAdaptador.ast, {});
        
        await fs.writeFile(xhtmlSourcePath, resultadoCore.xhtml, 'utf8');
        await fs.writeFile(cssSourcePath, cssReal, 'utf8');

        // Auditoría interna de métricas
        metricasCapturadas.nodosRaiz = resultadoCore.astEnriquecido.contenido ? resultadoCore.astEnriquecido.contenido.length : 0;
        
        const recorrerAST = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;
            metricasCapturadas.nodosTotales++;
            if (nodo.tipo) metricasCapturadas.frecuenciasSemanticas[nodo.tipo] = (metricasCapturadas.frecuenciasSemanticas[nodo.tipo] || 0) + 1;
            if (nodo.inDesignStyle) metricasCapturadas.frecuenciasFisicas[nodo.inDesignStyle] = (metricasCapturadas.frecuenciasFisicas[nodo.inDesignStyle] || 0) + 1;
            if (Array.isArray(nodo.contenido)) nodo.contenido.forEach(recorrerAST);
        };
        
        if (Array.isArray(resultadoCore.astEnriquecido.contenido)) {
            resultadoCore.astEnriquecido.contenido.forEach(recorrerAST);
        } else {
            recorrerAST(resultadoCore.astEnriquecido);
        }

        const manifestItems = [
            { id: 'content', href: 'Text/export.xhtml', mediaType: 'application/xhtml+xml' },
            { id: 'style', href: 'Styles/fragmento.css', mediaType: 'text/css' },
            { id: 'nav', href: 'nav.xhtml', mediaType: 'application/xhtml+xml', properties: 'nav' }
        ];

        resultadoEpub = await compilarEPUB({
            xhtmlPath: xhtmlSourcePath,
            cssPath: cssSourcePath,
            assetsDir: null,
            stagingDir,
            outputPath,
            metadata: { title: 'Constitución (Golden Test)', language: 'es-CO', identifier: 'urn:uuid:golden-corpus-2026' },
            manifestItems,
            spineIds: ['content'],
            navigation: [{ title: 'Inicio', href: 'Text/export.xhtml' }]
        });
    }, 30000);

    afterAll(async () => {
        try { await fs.rm(tempDir, { recursive: true, force: true }); } catch (e) {}
    });

    // ========================================================================
    // ASERCIONES DEL CONTRATO CONGELADO E15.3-A
    // ========================================================================
    test('A1: Identidad del fixture verificada', () => {
        expect(jsonCrudo.documento.titulo).toBe('fragmento.indd');
    });

    test('B1: Contrato de cardinalidad estricto (Baseline E15.3)', () => {
        expect(metricasCapturadas.nodosRaiz).toBe(5);
        expect(metricasCapturadas.nodosTotales).toBe(11);
        expect(metricasCapturadas.frecuenciasSemanticas.parrafo).toBe(5);
        expect(metricasCapturadas.frecuenciasSemanticas.texto).toBe(6);
    });

    test('B2: Cero nodos [VACÍO] en el AST canónico', () => {
        expect(JSON.stringify(resultadoCore.astEnriquecido)).not.toContain('[VACÍO]');
    });

    test('C1: Ausencia absoluta de contaminación física en XHTML', () => {
        expect(resultadoCore.xhtml).not.toMatch(/\bNaN\b/);
        expect(resultadoCore.xhtml).not.toMatch(/[A-Za-z]:\\[^"'<>]+/);
        expect(resultadoCore.xhtml).not.toMatch(/\sstyle\s*=\s*["'][^"']*["']/i);
    });

    test('D1: Certificación OCF y validación E14.4 exitosa', () => {
        expect(resultadoEpub.success).toBe(true);
        expect(resultadoEpub.validation.valid).toBe(true);
    });

    test('E1: Invariantes binarios del contenedor ZIP (mimetype y nav.xhtml)', () => {
        const zip = new AdmZip(outputPath);
        const entries = zip.getEntries();
        
        expect(entries[0].entryName).toBe('mimetype');
        expect(entries[0].header.method).toBe(0); // STORE
        
        const nombres = entries.map(e => e.entryName);
        expect(nombres).toContain('OEBPS/nav.xhtml');
        expect(nombres).toContain('OEBPS/content.opf');
    });

    test('F1: Zero Semantic Mutation — Hashes SHA-256 idénticos', async () => {
        const zip = new AdmZip(outputPath);
        const hashZip = await calcularHashBuffer(zip.getEntry('OEBPS/Text/export.xhtml').getData());
        const hashCore = await calcularHashBuffer(Buffer.from(resultadoCore.xhtml, 'utf8'));
        expect(hashZip).toBe(hashCore);
    });
});