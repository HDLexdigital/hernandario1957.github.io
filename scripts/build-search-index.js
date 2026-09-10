'use strict';

const { compilarSearchIndex } = require('../src/core/compiladores/search-index');

try {
    compilarSearchIndex();
    process.exit(0);
} catch (error) {
    console.error('[build-search-index] error:', error.message);
    process.exit(1);
}
