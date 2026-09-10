'use strict';

const { compilarWeb } = require('../src/core/compiladores/web');

try {
    compilarWeb();
    process.exit(0);
} catch (error) {
    console.error('[build-web] error:', error.message);
    process.exit(1);
}
