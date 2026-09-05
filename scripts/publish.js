'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sha256File(filePath) {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
}

async function generarEpub(ledm) {
    const { generateEpub } = require('../core/epub/EpubGenerator');
    return await generateEpub(ledm);
}

function generarPdfUa(ledmPath, outputPath) {
    const script = path.join(RAIZ, 'scripts', 'build-pdf-weasyprint.js');
    execFileSync('node', [script, ledmPath, outputPath], { stdio: 'inherit' });
}

function generarPdfPrint(ledmPath, outputPath) {
    const script = path.join(RAIZ, 'scripts', 'build-pdf-print.js');
    execFileSync('node', [script, ledmPath, outputPath], { stdio: 'inherit' });
}

async function publicar(ledmPath) {
    console.log('📄 Validando LEDM...');
    const ledm = JSON.parse(fs.readFileSync(ledmPath, 'utf8'));
    const documentId = ledm.meta?.documentId || 'UNKNOWN';

    ensureDir(PUBLIC_DIR);

    const artifacts = [];

    // 1. Web
    const { renderHtml } = require('../core/web/WebRenderer');
    const html = renderHtml(ledm);
    const webPath = path.join(PUBLIC_DIR, 'index.html');
    fs.writeFileSync(webPath, html, 'utf8');
    artifacts.push({
        type: 'web',
        path: path.relative(PUBLIC_DIR, webPath),
        checksum: sha256File(webPath),
        rendererVersion: 'WebRenderer'
    });

    // 2. EPUB (async)
    const epubBuffer = await generarEpub(ledm);
    const epubPath = path.join(PUBLIC_DIR, 'documento.epub');
    fs.writeFileSync(epubPath, epubBuffer);
    artifacts.push({
        type: 'epub',
        path: path.relative(PUBLIC_DIR, epubPath),
        checksum: sha256File(epubPath),
        rendererVersion: 'EpubGenerator'
    });

    // 3. PDF/UA
    const pdfUaInput = path.join(RAIZ, 'tmp-ledm.json');
    fs.writeFileSync(pdfUaInput, JSON.stringify(ledm, null, 2), 'utf8');
    const pdfUaPath = path.join(PUBLIC_DIR, 'documento-ua.pdf');
    generarPdfUa(pdfUaInput, pdfUaPath);
    artifacts.push({
        type: 'pdf-ua',
        path: path.relative(PUBLIC_DIR, pdfUaPath),
        checksum: sha256File(pdfUaPath),
        rendererVersion: 'build-pdf-weasyprint'
    });

    // 4. PDF/Print (PDF/X-1a)
    const pdfPrintBase = path.join(PUBLIC_DIR, 'documento-print-base.pdf');
    generarPdfPrint(pdfUaInput, pdfPrintBase);
    const pdfPrintFinal = path.join(PUBLIC_DIR, 'documento-print.pdf');
    const convertScript = path.join(RAIZ, 'scripts', 'convert-pdfx1a.sh');
    execFileSync('bash', [convertScript, pdfPrintBase, pdfPrintFinal], { stdio: 'inherit' });
    artifacts.push({
        type: 'pdf-print',
        path: path.relative(PUBLIC_DIR, pdfPrintFinal),
        checksum: sha256File(pdfPrintFinal),
        rendererVersion: 'build-pdf-print+ghostscript'
    });

    // 5. Índice
    const indice = ledm.structure.blocks.map(block => ({
        documentId,
        title: block.title || block.nodeId || 'Sin título',
        url: '#' + block.nodeId,
        nodeId: block.nodeId || ''
    }));
    const indicePath = path.join(PUBLIC_DIR, 'indice.json');
    fs.writeFileSync(indicePath, JSON.stringify(indice, null, 2), 'utf8');

    // 6. Manifiesto
    const manifest = {
        documentId,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        artifacts
    };
    const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    console.log('✅ Publicación completa generada correctamente.');
    console.log('Manifiesto:', manifestPath);
    console.log('Índice:', indicePath);
}

async function main() {
    const ledmPath = process.argv[2];
    if (!ledmPath) {
        console.error('Uso: node scripts/publish.js <ruta-ledm>');
        process.exit(1);
    }
    if (!fs.existsSync(ledmPath)) {
        console.error('❌ No existe el LEDM: ' + ledmPath);
        process.exit(1);
    }
    await publicar(ledmPath);
}

main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
