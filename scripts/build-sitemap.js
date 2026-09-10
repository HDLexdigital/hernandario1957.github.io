'use strict';

const { compilarSitemap } = require('../src/core/compiladores/sitemap');

try {
    compilarSitemap();
    process.exit(0);
} catch (error) {
    console.error('[build-sitemap] error:', error.message);
    process.exit(1);
}
