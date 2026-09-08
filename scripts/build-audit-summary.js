'use strict';

const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const outputPath = path.join(publicDir, 'audit-summary.json');

function readJSON(file) {
    const p = path.join(publicDir, file);
    if (!fs.existsSync(p)) return null;
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
        return null;
    }
}

const integrity = readJSON('integrity-report.json');
const external = readJSON('external-links-report.json');
const anchors = readJSON('anchors-report.json');

const integrityStatus = integrity ? integrity.status : 'SIN DATOS';
const externalStatus = external ? external.status : 'SIN DATOS';
const anchorsStatus = anchors ? anchors.status : 'SIN DATOS';

const integrityTotal = integrity && integrity.artifacts ? integrity.artifacts.length : 0;
const integrityErrors = integrity && integrity.artifacts ? integrity.artifacts.filter(a => !a.exists).length : 0;

const externalTotal = external && external.items ? external.items.length : 0;
const externalErrors = external && external.items ? external.items.filter(i => i.status !== 'OK').length : 0;

const anchorsTotal = anchors && anchors.items ? anchors.items.length : 0;
const anchorsErrors = anchors && anchors.items ? anchors.items.filter(i => i.status !== 'OK').length : 0;

const globalStatus = (integrityStatus === 'ERROR' || externalStatus === 'ERROR' || anchorsStatus === 'ERROR') ? 'ERROR' : 'OK';

const summary = {
    status: globalStatus,
    generatedAt: new Date().toISOString(),
    reports: {
        integrity: integrityStatus,
        externalLinks: externalStatus,
        anchors: anchorsStatus
    },
    counts: {
        integrityTotal,
        integrityErrors,
        externalLinksTotal: externalTotal,
        externalLinksErrors: externalErrors,
        anchorsTotal,
        anchorsErrors
    }
};

fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
console.log('✅ public/audit-summary.json generado.');
