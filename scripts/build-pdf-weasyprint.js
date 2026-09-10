'use strict';

const { compilarPdfWeasyPrint } = require('../src/core/compiladores/pdf/weasyprint');

try {
    const input = process.argv[2];
    const output = process.argv[3];
    compilarPdfWeasyPrint(input, output);
    process.exit(0);
} catch (error) {
    console.error('[build-pdf-weasyprint] error:', error.message);
    process.exit(1);
}
