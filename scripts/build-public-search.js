'use strict';

const { generarSearch } = require('../src/core/compiladores/dashboards/search');

try {
    generarSearch();
    process.exit(0);
} catch (error) {
    console.error('[build-public-search] error:', error.message);
    process.exit(1);
}
