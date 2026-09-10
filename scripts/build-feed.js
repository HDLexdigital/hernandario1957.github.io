'use strict';

const { compilarFeed } = require('../src/core/compiladores/feed');

try {
    compilarFeed();
    process.exit(0);
} catch (error) {
    console.error('[build-feed] error:', error.message);
    process.exit(1);
}
