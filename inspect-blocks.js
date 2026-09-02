'use strict';

const fs = require('fs');
const path = require('path');

const cidmRealPath = path.join(
    __dirname,
    'core',
    'integration',
    'fixtures',
    'authentic',
    'CIDM_real.json'
);

if (!fs.existsSync(cidmRealPath)) {
    console.error(`No se encontró CIDM_real.json en: ${cidmRealPath}`);
    process.exit(1);
}

const cidm = JSON.parse(fs.readFileSync(cidmRealPath, 'utf8'));

const bloquesObjetivo = ['story-001-b0020', 'story-001-b0021'];

for (const story of cidm.stories) {
    for (const block of story.blocks) {
        if (bloquesObjetivo.includes(block.blockId)) {
            console.log('==================================');
            console.log('blockId:', block.blockId);
            console.log('order:', block.order);
            console.log('styleId:', block.styleId);
            console.log('text:', JSON.stringify(block.text, null, 2));
            console.log('fragments:', JSON.stringify(block.fragments, null, 2));
            console.log('==================================\n');
        }
    }
}