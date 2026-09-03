'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const VERSION = '5.2.1';
const BASE_URL = `https://github.com/w3c/epubcheck/releases/download/v${VERSION}`;
const ZIP_NAME = `epubcheck-${VERSION}.zip`;
const CACHE_DIR = path.join(__dirname, '..', 'node_modules', '.cache', 'epubcheck');
const JAR_PATH = path.join(CACHE_DIR, `epubcheck-${VERSION}`, 'epubcheck.jar');
const PUBLICATION = process.argv[2] || 'publication_full.epub';

function descargar(url, destino, redirects = 0) {
    return new Promise((resolve, reject) => {
        if (redirects > 5) {
            reject(new Error('Demasiadas redirecciones al descargar'));
            return;
        }
        const file = fs.createWriteStream(destino);
        https.get(url, response => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                // Seguir redirección
                const nuevaUrl = new URL(response.headers.location, url).toString();
                file.close(() => {
                    fs.unlink(destino, () => {
                        descargar(nuevaUrl, destino, redirects + 1).then(resolve).catch(reject);
                    });
                });
                return;
            }
            if (response.statusCode !== 200) {
                file.close(() => {
                    fs.unlink(destino, () => {});
                });
                reject(new Error(`Error ${response.statusCode} al descargar ${url}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', reject);
    });
}

async function main() {
    if (!fs.existsSync(JAR_PATH)) {
        console.log('🔽 Descargando EPUBCheck oficial...');
        fs.mkdirSync(CACHE_DIR, { recursive: true });
        const zipPath = path.join(CACHE_DIR, ZIP_NAME);
        await descargar(`${BASE_URL}/${ZIP_NAME}`, zipPath);
        console.log('📦 Extrayendo...');
        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${CACHE_DIR}' -Force"`, { stdio: 'inherit' });
        console.log('✅ EPUBCheck descargado y extraído.');
    } else {
        console.log('📦 EPUBCheck ya está en caché.');
    }

    console.log(`✅ Ejecutando EPUBCheck sobre ${PUBLICATION}...`);
    try {
        execSync(`java -jar "${JAR_PATH}" "${PUBLICATION}"`, { stdio: 'inherit' });
        console.log('✅ EPUBCheck completado sin errores.');
    } catch (error) {
        console.error('❌ EPUBCheck detectó errores.');
        process.exit(1);
    }
}

main();