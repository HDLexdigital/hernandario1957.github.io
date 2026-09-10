'use strict';

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function validarIntegridad() {
    const reportePath = path.join(PUBLIC_DIR, 'integrity-report.json');
    if (!fs.existsSync(reportePath)) return { status: 'SIN DATOS' };
    return JSON.parse(fs.readFileSync(reportePath, 'utf8'));
}

module.exports = { validarIntegridad };
