'use strict';

const fs = require('fs');
const path = require('path');

const cidmRealPath = path.join(
    __dirname,
    '..',
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

// Localizar la historia que contiene los artículos (usaremos la primera con bloques body_base)
const story = cidm.stories.find(s =>
    (s.blocks || []).some(b =>
        b.styleId === 'style-p-p01_body_base' &&
        /^Artículo\s+\d+\./i.test(b.text || '')
    )
);

if (!story) {
    console.error('No se encontró una historia con artículos body_base.');
    process.exit(1);
}

console.log('=== SIMULACIÓN CIDM SUBSET 1–10 ===\n');
console.log(`Historia: ${story.storyId}\n`);

const blocks = story.blocks || [];

// Función para extraer número de artículo desde el texto
function getArticleNumber(block) {
    const match = (block.text || '').match(/^Artículo\s+(\d+)\./i);
    return match ? parseInt(match[1], 10) : null;
}

// Buscar índice de inicio (Artículo 1) y fin (Artículo 11)
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < blocks.length; i++) {
    const num = getArticleNumber(blocks[i]);
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
    const block = blocks[i];
    if (
        block.styleId === 'style-p-p01_body_base' ||
        block.styleId === 'style-p-p01_body_cont'
    ) {
        selectedBlocks.push(block);
    }
}

console.log(`Inicio:`);
console.log(`  blockId: ${selectedBlocks[0].blockId}`);
console.log(`  order:   ${selectedBlocks[0].order}`);
console.log(`  artículo: 1\n`);

console.log(`Fin:`);
console.log(`  blockId: ${selectedBlocks[selectedBlocks.length - 1].blockId}`);
console.log(`  order:   ${selectedBlocks[selectedBlocks.length - 1].order}`);
console.log(`  artículo: ${getArticleNumber(selectedBlocks[selectedBlocks.length - 1])}\n`);

console.log(`Límite excluido:`);
console.log(`  blockId: ${blocks[endIndex].blockId}`);
console.log(`  order:   ${blocks[endIndex].order}`);
console.log(`  artículo: 11\n`);

console.log(`Bloques seleccionados: ${selectedBlocks.length}\n`);

// Contar bloques por artículo
const articleCounts = new Map();
let currentArticle = null;

for (const block of selectedBlocks) {
    const num = getArticleNumber(block);
    if (num !== null) {
        currentArticle = num;
        articleCounts.set(currentArticle, 1);
    } else {
        // Es continuación del artículo actual
        if (currentArticle !== null) {
            articleCounts.set(currentArticle, (articleCounts.get(currentArticle) || 0) + 1);
        }
    }
}

for (const [num, count] of articleCounts.entries()) {
    console.log(`Artículo ${num}  → ${count} bloque${count !== 1 ? 's' : ''}`);
}

// Verificar que no se incluyen bloques del índice
const indexBlocksIncluded = selectedBlocks.filter(b => b.styleId === 'style-p-p05_idx_art');
console.log(`\nEntradas de índice (style-p-p05_idx_art) incluidas: ${indexBlocksIncluded.length}`);
if (indexBlocksIncluded.length > 0) {
    console.error('ERROR: Se incluyeron entradas de índice. Revisar algoritmo.');
    process.exit(1);
} else {
    console.log('Correcto: ninguna entrada de índice fue seleccionada.');
}

console.log('\n=== FIN SIMULACIÓN ===');