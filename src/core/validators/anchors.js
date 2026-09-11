'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'anchors.json');

function extractAnchorsFromHtml(html) {
    const anchors = [];
    const regex = /<h([1-6])\s+[^>]*\bid="([^"]+)"[^>]*>(.*?)<\/h\1>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        anchors.push({
            id: match[2],
            level: parseInt(match[1], 10),
            text: match[3].replace(/<[^>]+>/g, '').trim()
        });
    }
    return anchors;
}

function walkHtml(dir, callback) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkHtml(fullPath, callback);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            callback(fullPath);
        }
    }
}

function compilarAnchors() {
    const items = [];

    walkHtml(PUBLIC_DIR, (fullPath) => {
        const html = fs.readFileSync(fullPath, 'utf8');
        const anchors = extractAnchorsFromHtml(html);
        const relative = path.relative(PUBLIC_DIR, fullPath).replace(/\\/g, '/');
        const documentId = path.basename(relative, '.html');
        anchors.forEach(anchor => {
            items.push({
                documentId,
                url: '/' + relative + '#' + anchor.id,
                id: anchor.id,
                level: anchor.level,
                text: anchor.text,
                status: 'OK'
            });
        });
    });

    const report = {
        status: 'OK',
        generatedAt: new Date().toISOString(),
        items
    };

    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));
    console.log('Anchors generados: ' + items.length + ' en ' + OUTPUT_PATH);
    return report;
}

module.exports = { compilarAnchors, OUTPUT_PATH };
