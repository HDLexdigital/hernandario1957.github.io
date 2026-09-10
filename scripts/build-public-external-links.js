'use strict';

const { generarExternalLinks } = require('../src/core/compiladores/dashboards/external-links');

try {
    generarExternalLinks();
    process.exit(0);
} catch (error) {
    console.error('[build-public-external-links] error:', error.message);
    process.exit(1);
}
