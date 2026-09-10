'use strict';

const { generarSearchRelevance } = require('../src/core/compiladores/dashboards/search-relevance');

try {
    generarSearchRelevance();
    process.exit(0);
} catch (error) {
    console.error('[build-public-search-relevance] error:', error.message);
    process.exit(1);
}
