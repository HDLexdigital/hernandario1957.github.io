'use strict';

const { compilarGlobalTimeline } = require('../src/core/compiladores/global-timeline');

try {
    compilarGlobalTimeline();
    process.exit(0);
} catch (error) {
    console.error('[build-global-timeline] error:', error.message);
    process.exit(1);
}
