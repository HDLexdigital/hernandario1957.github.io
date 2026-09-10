'use strict';

const { generarMetrics } = require('../src/core/compiladores/dashboards/metrics');

try {
    generarMetrics();
    process.exit(0);
} catch (error) {
    console.error('[build-public-metrics] error:', error.message);
    process.exit(1);
}
