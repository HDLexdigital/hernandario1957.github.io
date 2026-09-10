'use strict';

const { generarNav } = require('../src/core/compiladores/dashboards/nav');

try {
    generarNav();
    process.exit(0);
} catch (error) {
    console.error('[build-public-nav] error:', error.message);
    process.exit(1);
}
