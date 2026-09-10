'use strict';

const { generarCollection } = require('../src/core/compiladores/dashboards/collection');

try {
    generarCollection();
    process.exit(0);
} catch (error) {
    console.error('[build-public-collection] error:', error.message);
    process.exit(1);
}
