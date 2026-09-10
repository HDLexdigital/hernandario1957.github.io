'use strict';

const { generarSearchAdvanced } = require('../src/core/compiladores/dashboards/search-advanced');

try {
    generarSearchAdvanced();
    process.exit(0);
} catch (error) {
    console.error('[build-public-search-advanced] error:', error.message);
    process.exit(1);
}
