'use strict';

const { generarAnchors } = require('../src/core/compiladores/dashboards/anchors');

try {
    generarAnchors();
    process.exit(0);
} catch (error) {
    console.error('[build-public-anchors] error:', error.message);
    process.exit(1);
}
