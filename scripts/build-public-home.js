'use strict';

const { generarHome } = require('../src/core/compiladores/dashboards/home');

try {
    generarHome();
    process.exit(0);
} catch (error) {
    console.error('[build-public-home] error:', error.message);
    process.exit(1);
}
