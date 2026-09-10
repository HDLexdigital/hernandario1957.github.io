'use strict';

const { generarDeployStatus } = require('../src/core/compiladores/dashboards/deploy-status');

try {
    generarDeployStatus();
    process.exit(0);
} catch (error) {
    console.error('[build-deploy-status] error:', error.message);
    process.exit(1);
}
