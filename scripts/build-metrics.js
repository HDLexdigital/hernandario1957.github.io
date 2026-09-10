'use strict';

const { compilarMetricas } = require('../src/core/compiladores/metricas');

try {
    compilarMetricas();
    process.exit(0);
} catch (error) {
    console.error('[build-metrics] error:', error.message);
    process.exit(1);
}
