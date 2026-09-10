'use strict';

const { generarExports } = require('../src/core/compiladores/dashboards/exports');

try {
    generarExports();
    process.exit(0);
} catch (error) {
    console.error('[build-public-exports] error:', error.message);
    process.exit(1);
}
