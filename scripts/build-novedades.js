'use strict';

const { compilarNovedades } = require('../src/core/compiladores/novedades');

try {
    compilarNovedades();
    process.exit(0);
} catch (error) {
    console.error('[build-novedades] error:', error.message);
    process.exit(1);
}
