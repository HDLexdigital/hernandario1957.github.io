'use strict';

const fs = require('fs');
const path = require('path');

// Rutas
const cidmRealPath = path.join(
    __dirname,
    '..',
    'integration',
    'fixtures',
    'authentic',
    'CIDM_real.json'
);
const outputPath = path.join(
    __dirname,
    '..',
    'integration',
    'fixtures',
    'authentic',
    'CIDM_subset_articulos_1_10.json'
);

// Verificar existencia del CIDM real
if (!fs.existsSync(cidmRealPath)) {
    console.error(`No se encontró CIDM_real.json en: ${cidmRealPath}`);
    process.exit(1);
}

// Cargar CIDM real
const cidmReal = JSON.parse(fs.readFileSync(cidmRealPath, 'utf8'));

// Localizar la historia que contiene los artículos (body_base con Artículo N.)
const story = cidmReal.stories.find(s =>
    (s.blocks || []).some(b =>
        b.styleId === 'style-p-p01_body_base' &&
        /^Artículo\s+\d+\./i.test(b.text || '')
    )
);

if (!story) {
    console.error('No se encontró una historia con artículos body_base.');
    process.exit(1);
}

// Función para extraer número de artículo
function getArticleNumber(block) {
    const match = (block.text || '').match(/^Artículo\s+(\d+)\./i);
    return match ? parseInt(match[1], 10) : null;
}

// Buscar índices de inicio (Artículo 1) y límite (Artículo 11)
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < story.blocks.length; i++) {
    const num = getArticleNumber(story.blocks[i]);
    if (num === 1 && startIndex === -1) {
        startIndex = i;
    }
    if (num === 11 && startIndex !== -1) {
        endIndex = i;
        break;
    }
}

if (startIndex === -1) {
    console.error('No se encontró Artículo 1 en body_base.');
    process.exit(1);
}

if (endIndex === -1) {
    console.error('No se encontró Artículo 11 como límite.');
    process.exit(1);
}

// Seleccionar bloques con estilo body_base o body_cont dentro del intervalo
const selectedBlocks = [];
for (let i = startIndex; i < endIndex; i++) {
    const block = story.blocks[i];
    if (
        block.styleId === 'style-p-p01_body_base' ||
        block.styleId === 'style-p-p01_body_cont'
    ) {
        selectedBlocks.push(block);
    }
}

// Construir subset
const subset = {
    meta: { ...cidmReal.meta },
    styleDictionary: { ...cidmReal.styleDictionary },
    stories: [
        {
            storyId: story.storyId,
            order: story.order,
            blocks: selectedBlocks
        }
    ]
};

// Escribir archivo sin alterar el original
fs.writeFileSync(outputPath, JSON.stringify(subset, null, 2), 'utf8');

console.log(`\n✅ Subset Artículos 1–10 creado en:`);
console.log(`   ${outputPath}`);
console.log(`   Bloques seleccionados: ${selectedBlocks.length}\n`);