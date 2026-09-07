'use strict';

const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const reportPath = path.join(publicDir, 'integrity-report.json');

function listHtmlFiles(dir) {
    const result = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            result.push(...listHtmlFiles(full));
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            result.push(full);
        }
    }
    return result;
}

function isExternal(href) {
    return /^(https?:\/\/|mailto:|tel:|#|\/\/)/i.test(href) || href.startsWith('/api/');
}

function extractRefs(html) {
    const refs = [];
    const re = /(?:href|src)=["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const ref = m[1];
        if (!isExternal(ref) && /\.(css|js|json)$/i.test(ref)) {
            refs.push(ref);
        }
    }
    return refs;
}

function extractNavLinks() {
    const navPath = path.join(publicDir, 'nav.html');
    if (!fs.existsSync(navPath)) return [];
    const html = fs.readFileSync(navPath, 'utf8');
    const links = [];
    const re = /<a\s+[^>]*href=["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const href = m[1];
        if (!isExternal(href) && href.endsWith('.html')) {
            links.push(href);
        }
    }
    return links;
}

function fileExists(relPath) {
    const abs = path.join(publicDir, relPath);
    return fs.existsSync(abs);
}

function generate() {
    const artifacts = [];
    const htmlFiles = listHtmlFiles(publicDir);

    // Chequear dashboards listados en nav.html
    for (const href of extractNavLinks()) {
        const exists = fileExists(href);
        artifacts.push({
            type: 'dashboard',
            href,
            file: path.join('public', href),
            exists,
            message: exists ? null : 'Dashboard referenciado no existe'
        });
    }

    // Chequear referencias locales en todos los HTML
    for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        const refs = extractRefs(html);
        for (const ref of refs) {
            const exists = fileExists(ref);
            artifacts.push({
                type: 'reference',
                href: ref,
                file: path.relative(process.cwd(), file),
                exists,
                message: exists ? null : 'Referencia local rota'
            });
        }
    }

    const hasErrors = artifacts.some(a => !a.exists);
    const report = {
        status: hasErrors ? 'ERROR' : 'OK',
        generatedAt: new Date().toISOString(),
        artifacts
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(hasErrors ? '❌ Se encontraron roturas.' : '✅ Reporte de integridad generado sin errores.');
    return report;
}

if (require.main === module) {
    generate();
}

module.exports = { generate, reportPath };
