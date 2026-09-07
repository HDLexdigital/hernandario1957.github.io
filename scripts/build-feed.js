'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DEFAULT_NOVEDADES_PATH = path.join(RAIZ, 'public', 'novedades.json');
const DEFAULT_FEED_PATH = path.join(RAIZ, 'public', 'feed.xml');

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function generarFeed(novedades) {
    const items = novedades.map(item => {
        const pubDate = item.createdAt ? new Date(item.createdAt).toUTCString() : '';
        const title = item.title || item.documentId || 'Sin título';
        const link = 'https://digitalhd.com' + (item.url || '/');
        const guid = link;

        return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(guid)}</guid>
      <description>${escapeXml(title)}</description>
      <pubDate>${escapeXml(pubDate)}</pubDate>
    </item>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>LexDigitalHD — Novedades Jurídicas</title>
    <link>https://digitalhd.com</link>
    <description>Últimas normas y actualizaciones del corpus jurídico</description>
    <language>es</language>
${items}
  </channel>
</rss>`;
}

function main() {
    const novedadesPath = process.env.NOVEDADES_PATH || DEFAULT_NOVEDADES_PATH;
    const feedPath = process.env.FEED_PATH || DEFAULT_FEED_PATH;

    if (!fs.existsSync(novedadesPath)) {
        console.error('❌ No se encontró novedades.json en ' + novedadesPath);
        process.exit(1);
    }

    const novedades = JSON.parse(fs.readFileSync(novedadesPath, 'utf8'));
    const feed = generarFeed(novedades);

    fs.mkdirSync(path.dirname(feedPath), { recursive: true });
    fs.writeFileSync(feedPath, feed, 'utf8');

    console.log(`✅ Feed RSS generado en ${feedPath}`);
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

module.exports = { generarFeed };
