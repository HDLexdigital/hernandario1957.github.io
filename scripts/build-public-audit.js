'use strict';

const { generarAudit } = require('../src/core/compiladores/dashboards/audit');

try {
    generarAudit();
    process.exit(0);
} catch (error) {
    console.error('[build-public-audit] error:', error.message);
    process.exit(1);
}
