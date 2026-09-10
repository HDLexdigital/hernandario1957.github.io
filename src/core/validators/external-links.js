'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const RAIZ = path.join(__dirname, '..', '..', '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');
const REPORT_PATH = path.join(PUBLIC_DIR, 'external-links-report.json');
const TIMEOUT_MS = 5000;

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
    return /^https?:\/\//i.test(href);
}

function isInternal(href) {
    return /(lexdigitalhd\.com|github\.io)/i.test(href) || href.startsWith('/api/');
}

function extractExternalLinks(html) {
    const links = [];
    const re = /(?:href|src)=["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const url = m[1];
        if (isExternal(url) && !isInternal(url)) {
            links.push(url);
        }
    }
    return links;
}

function checkUrl(url) {
    return new Promise(resolve => {
        const client = url.startsWith('https') ? https : http;
        const req = client.request(url, { method: 'HEAD', timeout: TIMEOUT_MS }, res => {
            res.resume();
            resolve({ url, statusCode: res.statusCode, status: res.statusCode < 400 ? 'OK' : 'ERROR' });
        });
        req.on('timeout', () => {
            req.destroy();
            resolve({ url, statusCode: null, status: 'TIMEOUT' });
        });
        req.on('error', () => {
            resolve({ url, statusCode: null, status: 'TIMEOUT' });
        });
        req.end();
    });
}

async function compilarExternalLinks() {
    const htmlFiles = listHtmlFiles(PUBLIC_DIR);
    const allLinks = [];
    const seen = new Set();

    for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        const links = extractExternalLinks(html);
        for (const link of links) {
            if (!seen.has(link)) {
                seen.add(link);
                allLinks.push({ url: link, files: [path.relative(process.cwd(), file)] });
            } else {
                const existing = allLinks.find(item => item.url === link);
                if (existing) existing.files.push(path.relative(process.cwd(), file));
            }
        }
    }

    const results = [];
    for (const item of allLinks) {
        const check = await checkUrl(item.url);
        results.push({
            url: item.url,
            statusCode: check.statusCode,
            status: check.status,
            files: item.files
        });
    }

    const hasErrors = results.some(r => r.status !== 'OK');
    const report = {
        status: hasErrors ? 'ERROR' : 'OK',
        generatedAt: new Date().toISOString(),
        items: results
    };

    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    console.log(hasErrors ? '❌ Se encontraron enlaces externos con problemas.' : '✅ Reporte de enlaces externos generado sin errores.');
    return report;
}

module.exports = { compilarExternalLinks, REPORT_PATH };
