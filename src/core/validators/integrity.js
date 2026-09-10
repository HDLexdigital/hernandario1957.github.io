'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');
const REPORT_PATH = path.join(PUBLIC_DIR, 'integrity-report.json');

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
    const navPath = path.join(PUBLIC_DIR, 'nav.html');
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
    const abs = path.join(PUBLIC_DIR, relPath);
    return fs.existsSync(abs);
}

function compilarIntegridad() {
    const artifacts = [];
    const htmlFiles = listHtmlFiles(PUBLIC_DIR);

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

    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    console.log(hasErrors ? '❌ Se encontraron roturas.' : '✅ Reporte de integridad generado sin errores.');
    return report;
}

// Lector: consulta el reporte existente sin regenerarlo
function validarIntegridad() {
    if (!fs.existsSync(REPORT_PATH)) return { status: 'SIN DATOS' };
    return JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
}

module.exports = { compilarIntegridad, validarIntegridad, REPORT_PATH };
