'use strict';

const { generarGlobalTimelineHTML } = require('../src/core/compiladores/dashboards/global-timeline');

try {
    generarGlobalTimelineHTML();
    process.exit(0);
} catch (error) {
    console.error('[build-global-timeline-html] error:', error.message);
    process.exit(1);
}
