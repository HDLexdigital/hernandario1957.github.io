'use strict';

const { compilarCollectionExport } = require('../src/core/compiladores/exports');

try {
    compilarCollectionExport();
    process.exit(0);
} catch (error) {
    console.error('[build-collection-export] error:', error.message);
    process.exit(1);
}
