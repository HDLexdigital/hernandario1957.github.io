'use strict';

const { compilarIntegridad } = require('../src/core/validators/integrity');

try {
    compilarIntegridad();
    process.exit(0);
} catch (error) {
    console.error('[build-integrity-report] error:', error.message);
    process.exit(1);
}
