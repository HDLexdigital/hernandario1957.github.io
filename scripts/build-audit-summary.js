'use strict';

const { compilarAuditSummary } = require('../src/core/validators/audit-summary');

try {
    compilarAuditSummary();
    process.exit(0);
} catch (error) {
    console.error('[build-audit-summary] error:', error.message);
    process.exit(1);
}
