'use strict';

const { compilarExternalLinks } = require('../src/core/validators/external-links');

compilarExternalLinks()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('[build-external-links-report] error:', error.message);
        process.exit(1);
    });
