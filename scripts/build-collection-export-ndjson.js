'use strict';

const { compilarCollectionNDJSON } = require('../src/core/compiladores/exports');

try {
    compilarCollectionNDJSON();
    process.exit(0);
} catch (error) {
    console.error('[build-collection-export-ndjson] error:', error.message);
    process.exit(1);
}
