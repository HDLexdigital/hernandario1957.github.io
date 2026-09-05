'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function publicar(ledmPath) {
    const ledm = JSON.parse(fs.readFileSync(ledmPath, 'utf8'));
    const documentId = ledm.meta?.documentId || 'UNKNOWN';

    ensureDir(PUBLIC_DIR);

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${documentId}</title></head>
<body><h1>${documentId}</h1></body>
</html>`;
    fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), html, 'utf8');

    const indice = [
        {
            documentId,
            title: documentId,
            url: `#${documentId}`,
            nodeId: documentId
        }
    ];
    fs.writeFileSync(path.join(PUBLIC_DIR, 'indice.json'), JSON.stringify(indice, null, 2), 'utf8');

    const manifest = {
        documentId,
        version: '0.1.0-draft',
        createdAt: new Date().toISOString(),
        artifacts: []
    };
    fs.writeFileSync(path.join(PUBLIC_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

    console.log('✅ Publicación estructural generada correctamente.');
}

function main() {
    const ledmPath = process.argv[2];
    if (!ledmPath) {
        console.error('Uso: node scripts/publish.js <ruta-ledm>');
        process.exit(1);
    }
    if (!fs.existsSync(ledmPath)) {
        console.error(`❌ No existe el LEDM: ${ledmPath}`);
        process.exit(1);
    }
    publicar(ledmPath);
}

try {
    main();
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}
