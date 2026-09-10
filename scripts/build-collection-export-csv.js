'use strict';

const { compilarCollectionCSV } = require('../src/core/compiladores/exports');

try {
    compilarCollectionCSV();
    process.exit(0);
} catch (error) {
    console.error('[build-collection-export-csv] error:', error.message);
    process.exit(1);
}
