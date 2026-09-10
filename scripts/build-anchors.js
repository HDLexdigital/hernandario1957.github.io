'use strict';

const { compilarAnchors } = require('../src/core/validators/anchors');

try {
    compilarAnchors();
    process.exit(0);
} catch (error) {
    console.error('[build-anchors] error:', error.message);
    process.exit(1);
}
