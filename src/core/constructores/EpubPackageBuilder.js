'use strict';

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

class EpubPackageBuilder {
    static async construir(dirOutput, metadatos) {
        console.log("📚 8. Iniciando empaquetado EPUB3...");

        const dirEpub = path.join(dirOutput, 'EPUB_Generado');
        const dirMetaInf = path.join(dirEpub, 'META-INF');
        const dirOebps = path.join(dirEpub, 'OEBPS');
        const dirAssets = path.join(dirOebps, 'assets');

        if (!fs.existsSync(dirEpub)) fs.mkdirSync(dirEpub, { recursive: true });
        if (!fs.existsSync(dirMetaInf)) fs.mkdirSync(dirMetaInf);
        if (!fs.existsSync(dirOebps)) fs.mkdirSync(dirOebps);
        if (!fs.existsSync(dirAssets)) fs.mkdirSync(dirAssets);

        // Archivos base del estándar
        fs.writeFileSync(path.join(dirEpub, 'mimetype'), 'application/epub+zip', 'utf8');

        const containerXml = `<?xml version="1.0" encoding="UTF-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n    <rootfiles>\n        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n    </rootfiles>\n</container>`;
        fs.writeFileSync(path.join(dirMetaInf, 'container.xml'), containerXml, 'utf8');

        // Trasladar recursos
        const rutaXhtml = path.join(dirOutput, 'LexCodex_Final.xhtml');
        const rutaToc = path.join(dirOutput, 'toc.xhtml');
        const rutaCss = path.join(dirOutput, 'assets', 'lexcodex.css');

        if (fs.existsSync(rutaXhtml)) fs.copyFileSync(rutaXhtml, path.join(dirOebps, 'LexCodex_Final.xhtml'));
        if (fs.existsSync(rutaToc)) fs.copyFileSync(rutaToc, path.join(dirOebps, 'toc.xhtml'));
        if (fs.existsSync(rutaCss)) fs.copyFileSync(rutaCss, path.join(dirAssets, 'lexcodex.css'));

        // Generar content.opf
        const titulo = metadatos.titulo || "Documento Legal";
        const idioma = metadatos.idioma || "es-CO";
        const uuid = "urn:uuid:" + Math.random().toString(36).substring(2, 15);
        const fecha = new Date().toISOString().split('T')[0];

        const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>\n<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">\n    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n        <dc:identifier id="pub-id">${uuid}</dc:identifier>\n        <dc:title>${titulo}</dc:title>\n        <dc:language>${idioma}</dc:language>\n        <dc:date>${fecha}</dc:date>\n        <meta property="dcterms:modified">${new Date().toISOString().replace(/\\.\\d+Z$/, 'Z')}</meta>\n    </metadata>\n    <manifest>\n        <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n        <item id="content" href="LexCodex_Final.xhtml" media-type="application/xhtml+xml"/>\n        <item id="css" href="assets/lexcodex.css" media-type="text/css"/>\n    </manifest>\n    <spine>\n        <itemref idref="toc"/>\n        <itemref idref="content"/>\n    </spine>\n</package>`;
        fs.writeFileSync(path.join(dirOebps, 'content.opf'), contentOpf, 'utf8');

        // Ejecutar compresión estricta
        console.log("🗜️ 9. Comprimiendo bajo estándar OCF (store:true para mimetype)...");
        const outputEpubPath = path.join(dirOutput, 'LexCodex_Final.epub');
        await this._comprimirEpub(dirEpub, outputEpubPath);
        
        return outputEpubPath;
    }

    static _comprimirEpub(inputDir, outputEpubPath) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputEpubPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => resolve());
            archive.on('error', (err) => reject(err));
            archive.pipe(output);

            // 1. mimetype (sin compresión)
            const mimetypePath = path.join(inputDir, 'mimetype');
            const mimetypeContent = fs.readFileSync(mimetypePath, 'ascii');
            archive.append(mimetypeContent, { name: 'mimetype', store: true });

            // 2. Resto de archivos
            const addDirectory = (dir, baseDir = '') => {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    const relativePath = path.join(baseDir, entry.name).replace(/\\/g, '/');
                    if (relativePath === 'mimetype') continue;

                    if (entry.isDirectory()) {
                        addDirectory(fullPath, relativePath);
                    } else {
                        archive.file(fullPath, { name: relativePath });
                    }
                }
            };

            addDirectory(inputDir);
            archive.finalize();
        });
    }
}

module.exports = EpubPackageBuilder;