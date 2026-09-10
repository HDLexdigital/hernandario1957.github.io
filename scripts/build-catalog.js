'use strict';

const { compilarCatalogo } = require('../src/core/compiladores/catalogo');

try {
    compilarCatalogo();
    process.exit(0);
} catch (error) {
    console.error('[build-catalog] error:', error.message);
    process.exit(1);
}
