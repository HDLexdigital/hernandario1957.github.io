'use strict';

const { generarIntegrity } = require('../src/core/compiladores/dashboards/integrity');

try {
    generarIntegrity();
    process.exit(0);
} catch (error) {
    console.error('[build-public-integrity] error:', error.message);
    process.exit(1);
}
