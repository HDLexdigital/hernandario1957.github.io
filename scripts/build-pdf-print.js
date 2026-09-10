'use strict';

const { compilarPdfPrint } = require('../src/core/compiladores/pdf/print');

try {
    const input = process.argv[2];
    const output = process.argv[3];
    compilarPdfPrint(input, output);
    process.exit(0);
} catch (error) {
    console.error('[build-pdf-print] error:', error.message);
    process.exit(1);
}
