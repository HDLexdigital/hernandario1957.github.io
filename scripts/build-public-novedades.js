'use strict';

const { generarNovedades } = require('../src/core/compiladores/dashboards/novedades');

try {
    generarNovedades();
    process.exit(0);
} catch (error) {
    console.error('[build-public-novedades] error:', error.message);
    process.exit(1);
}
