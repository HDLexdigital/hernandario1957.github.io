'use strict';

const { compilarPdfFull } = require('../src/core/compiladores/pdf/full');

try {
    compilarPdfFull();
    process.exit(0);
} catch (error) {
    console.error('[build-pdf-full] error:', error.message);
    process.exit(1);
}
