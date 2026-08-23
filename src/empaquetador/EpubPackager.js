/**
 * @fileoverview src/empaquetador/EpubPackager.js
 *
 * E14.1 / E14.5 — Staging físico OCF y Empaquetador ZIP Manifest-Driven para EPUB3.
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const { createWriteStream } = require('fs');

const archiverPkg = require('archiver');

function crearArchivadorZIP(format, options) {
    if (typeof archiverPkg === 'function') {
        return archiverPkg(format, options);
    }
    if (typeof archiverPkg.create === 'function') {
        return archiverPkg.create(format, options);
    }
    if (format === 'zip' && typeof archiverPkg.ZipArchive === 'function') {
        return new archiverPkg.ZipArchive(options);
    }
    if (typeof archiverPkg.Archiver === 'function') {
        return new archiverPkg.Archiver(format, options);
    }
    if (archiverPkg.default) {
        if (typeof archiverPkg.default === 'function') {
            return archiverPkg.default(format, options);
        }
        if (typeof archiverPkg.default.create === 'function') {
            return archiverPkg.default.create(format, options);
        }
    }
    throw new TypeError(`No se pudo resolver archiver. Claves disponibles: ${Object.keys(archiverPkg).join(', ')}`);
}

const { DOMParser } = require('@xmldom/xmldom');
const { validarStaging } = require('./EpubValidator');

const MIME_TYPE = 'application/epub+zip';

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0"
    xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile
            full-path="OEBPS/content.opf"
            media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`;

async function verificarArchivo(filePath, nombre) {
    if (!filePath || typeof filePath !== 'string') {
        throw new TypeError(`${nombre} debe ser una ruta válida`);
    }

    try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) {
            throw new Error(`${nombre} no es un archivo: ${filePath}`);
        }
    } catch (error) {
        throw new Error(
            `E14.1: No existe el archivo ${nombre}: ${filePath}`
        );
    }
}

async function prepararEsqueletoEPUB({
    xhtmlPath,
    cssPath,
    assetsDir,
    stagingDir
}) {
    if (!stagingDir || typeof stagingDir !== 'string') {
        throw new TypeError('stagingDir debe ser una ruta válida');
    }

    await verificarArchivo(xhtmlPath, 'xhtmlPath');
    await verificarArchivo(cssPath, 'cssPath');

    if (assetsDir !== undefined && assetsDir !== null) {
        const stat = await fs.stat(assetsDir);
        if (!stat.isDirectory()) {
            throw new Error(
                `E14.1: assetsDir no es un directorio: ${assetsDir}`
            );
        }
    }

    const metaInfDir = path.join(stagingDir, 'META-INF');
    const oebpsDir = path.join(stagingDir, 'OEBPS');

    const textDir = path.join(oebpsDir, 'Text');
    const stylesDir = path.join(oebpsDir, 'Styles');
    const imagesDir = path.join(oebpsDir, 'Images');

    await fs.mkdir(metaInfDir, { recursive: true });
    await fs.mkdir(textDir, { recursive: true });
    await fs.mkdir(stylesDir, { recursive: true });
    await fs.mkdir(imagesDir, { recursive: true });

    const mimetypePath = path.join(stagingDir, 'mimetype');
    await fs.writeFile(mimetypePath, MIME_TYPE, { encoding: 'utf8', flag: 'w' });

    const containerPath = path.join(metaInfDir, 'container.xml');
    await fs.writeFile(containerPath, CONTAINER_XML, { encoding: 'utf8', flag: 'w' });

    const xhtmlDestination = path.join(textDir, path.basename(xhtmlPath));
    await fs.copyFile(xhtmlPath, xhtmlDestination);

    const cssDestination = path.join(stylesDir, path.basename(cssPath));
    await fs.copyFile(cssPath, cssDestination);

    let copiedAssets = [];
    if (assetsDir) {
        const entries = await fs.readdir(assetsDir, { withFileTypes: true });
        for (const entry of entries) {
            const source = path.join(assetsDir, entry.name);
            const destination = path.join(imagesDir, entry.name);
            if (entry.isFile()) {
                await fs.copyFile(source, destination);
                copiedAssets.push(destination);
            }
        }
    }

    return {
        stagingDir,
        mimetypePath,
        containerPath,
        xhtmlPath: xhtmlDestination,
        cssPath: cssDestination,
        imagesDir,
        copiedAssets
    };
}

async function empaquetarEPUB({ stagingDir, outputPath }) {
    if (!stagingDir || typeof stagingDir !== 'string') {
        throw new TypeError('stagingDir debe ser una ruta válida');
    }

    if (!outputPath || typeof outputPath !== 'string') {
        throw new TypeError('outputPath debe ser una ruta válida');
    }

    const reporte = await validarStaging(stagingDir);

    if (!reporte.valid) {
        const error = new Error('E14.5 abortado: el staging OCF no superó la validación estructural E14.4.');
        error.code = 'E14.5_INVALID_STAGING';
        error.validationReport = reporte;
        throw error;
    }

    const opfPath = path.join(stagingDir, 'OEBPS', 'content.opf');
    const opfXml = await fs.readFile(opfPath, 'utf8');
    const doc = new DOMParser().parseFromString(opfXml, 'text/xml');
    const items = Array.from(doc.getElementsByTagName('item'));
    const manifestHrefs = items.map(item => item.getAttribute('href').trim());

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
        const outputStream = createWriteStream(outputPath);
        const archive = crearArchivadorZIP('zip', {
            zlib: { level: 9 }
        });

        const entriesEmited = [];

        outputStream.on('close', () => {
            resolve({
                outputPath,
                bytes: archive.pointer(),
                entries: entriesEmited
            });
        });

        outputStream.on('error', reject);
        archive.on('error', reject);

        archive.pipe(outputStream);

        archive.append(MIME_TYPE, {
            name: 'mimetype',
            store: true
        });
        entriesEmited.push('mimetype');

        const containerPath = path.join(stagingDir, 'META-INF', 'container.xml');
        archive.file(containerPath, { name: 'META-INF/container.xml' });
        entriesEmited.push('META-INF/container.xml');

        archive.file(opfPath, { name: 'OEBPS/content.opf' });
        entriesEmited.push('OEBPS/content.opf');

        for (const href of manifestHrefs) {
            const rutaFisica = path.join(stagingDir, 'OEBPS', href);
            const rutaEnZip = path.posix.join('OEBPS', href);

            archive.file(rutaFisica, { name: rutaEnZip });
            entriesEmited.push(rutaEnZip);
        }

        archive.finalize();
    });
}

module.exports = {
    prepararEsqueletoEPUB,
    empaquetarEPUB,
    MIME_TYPE
};