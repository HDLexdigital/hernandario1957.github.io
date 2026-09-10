'use strict';

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function generarTimeline(timeline) {
    const outputPath = path.join(PUBLIC_DIR, 'global-timeline.json');
    fs.writeFileSync(outputPath, JSON.stringify(timeline, null, 2), 'utf8');
    return outputPath;
}

module.exports = { generarTimeline };
