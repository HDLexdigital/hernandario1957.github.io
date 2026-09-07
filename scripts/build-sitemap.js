'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DEFAULT_CATALOGO_PATH = path.join(RAIZ, 'public', 'catalogo.json');
const DEFAULT_SITEMAP_PATH = path.join(RAIZ, 'public', 'sitemap.xml');
const DEFAULT_ROBOTS_PATH = path.join(RAIZ, 'public', 'robots.txt');

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function generarSitemap(catalogo) {
    const urls = [];

    for (const doc of catalogo) {
        urls.push({
            loc: '/' + encodeURIComponent(doc.documentId) + '/',
            changefreq: 'monthly',
            priority: '1.0'
        });

        (doc.versions || []).forEach(versionId => {
            urls.push({
                loc: '/' + encodeURIComponent(doc.documentId) + '/' + encodeURIComponent(versionId) + '/',
                changefreq: 'yearly',
                priority: '0.8'
            });
        });
    }

    const urlset = urls.map(url => `  <url>
    <loc>https://digitalhd.com${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
}

function generarRobots() {
    return `User-agent: *
Allow: /
Disallow: /admin

Sitemap: https://digitalhd.com/sitemap.xml
`;
}

function main() {
    const catalogoPath = process.env.CATALOGO_PATH || DEFAULT_CATALOGO_PATH;
    const sitemapPath = process.env.SITEMAP_PATH || DEFAULT_SITEMAP_PATH;
    const robotsPath = process.env.ROBOTS_PATH || DEFAULT_ROBOTS_PATH;

    if (!fs.existsSync(catalogoPath)) {
        console.error('❌ No se encontró el catálogo en ' + catalogoPath);
        process.exit(1);
    }

    const catalogo = JSON.parse(fs.readFileSync(catalogoPath, 'utf8'));

    fs.mkdirSync(path.dirname(sitemapPath), { recursive: true });
    fs.writeFileSync(sitemapPath, generarSitemap(catalogo), 'utf8');
    fs.writeFileSync(robotsPath, generarRobots(), 'utf8');

    console.log('✅ sitemap.xml y robots.txt generados correctamente.');
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

module.exports = {
    generarSitemap,
    generarRobots
};
