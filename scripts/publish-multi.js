'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const PUBLICACIONES_DIR = path.join(RAIZ, 'publicaciones');
const PUBLIC_DIR = path.join(RAIZ, 'public');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sha256File(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function listarDocumentos() {
    return fs.readdirSync(PUBLICACIONES_DIR, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => {
            const dir = path.join(PUBLICACIONES_DIR, entry.name);
            const archivos = fs.readdirSync(dir).filter(f => f.endsWith('.ledm.json'));
            if (archivos.length === 0) return null;
            return {
                carpeta: entry.name,
                ledmPath: path.join(dir, archivos[0])
            };
        })
        .filter(Boolean);
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

async function procesarDocumento(documento) {
    const ledm = JSON.parse(fs.readFileSync(documento.ledmPath, 'utf8'));
    const documentId = ledm.meta?.documentId || documento.carpeta;

    const docDir = path.join(PUBLIC_DIR, documentId);
    ensureDir(docDir);

    const artifacts = [];

    const { renderHtml } = require('../core/web/WebRenderer');
    const html = renderHtml(ledm);
    const webPath = path.join(docDir, 'index.html');
    fs.writeFileSync(webPath, html, 'utf8');
    artifacts.push({
        type: 'web',
        path: path.relative(docDir, webPath),
        checksum: sha256File(webPath),
        rendererVersion: 'WebRenderer'
    });

    const epubBuffer = await generarEpub(ledm);
    const epubPath = path.join(docDir, 'documento.epub');
    fs.writeFileSync(epubPath, epubBuffer);
    artifacts.push({
        type: 'epub',
        path: path.relative(docDir, epubPath),
        checksum: sha256File(epubPath),
        rendererVersion: 'EpubGenerator'
    });

    const pdfUaTmp = path.join(RAIZ, 'tmp-' + documentId + '.json');
    fs.writeFileSync(pdfUaTmp, JSON.stringify(ledm, null, 2));
    const pdfUaPath = path.join(docDir, 'documento-ua.pdf');
    generarPdfUa(pdfUaTmp, pdfUaPath);
    artifacts.push({
        type: 'pdf-ua',
        path: path.relative(docDir, pdfUaPath),
        checksum: sha256File(pdfUaPath),
        rendererVersion: 'build-pdf-weasyprint'
    });

    const pdfPrintBase = path.join(docDir, 'documento-print-base.pdf');
    generarPdfPrint(pdfUaTmp, pdfPrintBase);
    const pdfPrintFinal = path.join(docDir, 'documento-print.pdf');
    const convertScript = path.join(RAIZ, 'scripts', 'convert-pdfx1a.sh');
    execFileSync('bash', [convertScript, pdfPrintBase, pdfPrintFinal], { stdio: 'inherit' });
    artifacts.push({
        type: 'pdf-print',
        path: path.relative(docDir, pdfPrintFinal),
        checksum: sha256File(pdfPrintFinal),
        rendererVersion: 'build-pdf-print+ghostscript'
    });

    const indice = ledm.structure.blocks.map(block => ({
        documentId,
        title: block.title || block.nodeId || 'Sin título',
        url: '#' + block.nodeId,
        nodeId: block.nodeId || ''
    }));
    fs.writeFileSync(path.join(docDir, 'indice.json'), JSON.stringify(indice, null, 2));

    const manifest = {
        documentId,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        artifacts
    };
    fs.writeFileSync(path.join(docDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    return {
        documentId,
        title: ledm.structure?.title || documentId,
        indice
    };
}

async function main() {
    ensureDir(PUBLIC_DIR);

    const documentos = listarDocumentos();
    if (documentos.length === 0) {
        console.error('❌ No se encontraron documentos en publicaciones/');
        process.exit(1);
    }

    const globalIndex = [];

    for (const documento of documentos) {
        console.log(`📄 Procesando: ${documento.carpeta}`);
        const resultado = await procesarDocumento(documento);
        globalIndex.push({
            documentId: resultado.documentId,
            title: resultado.title,
            nodeId: resultado.indice[0]?.nodeId || '',
            url: `/${resultado.documentId}/`
        });
    }

    fs.writeFileSync(path.join(PUBLIC_DIR, 'indice-general.json'), JSON.stringify(globalIndex, null, 2));
    console.log('✅ Publicación multi-documento completada.');
}

main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
