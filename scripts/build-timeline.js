'use strict';

const { compilarTimeline } = require('../src/core/compiladores/timeline');

try {
    compilarTimeline();
    process.exit(0);
} catch (error) {
    console.error('[build-timeline] error:', error.message);
    process.exit(1);
}
