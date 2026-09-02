'use strict';

const fs = require('fs');
const path = require('path');

const cidmPath = path.join(__dirname, '..', 'integration', 'fixtures', 'authentic', 'CIDM_real.json');
const mapPath = path.join(__dirname, 'mappings', 'semantic-map.json');

if (!fs.existsSync(cidmPath) || !fs.existsSync(mapPath)) {
    console.error('Archivos necesarios no encontrados.');
    process.exit(1);
}

const cidm = JSON.parse(fs.readFileSync(cidmPath, 'utf8'));
const semanticMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const paragraphStyles = semanticMap.paragraphStyles || {};
const characterStyles = semanticMap.characterStyles || {};

// Mapa para acumular información
const audit = {
    paragraph: {},   // styleId -> { count, examples: [], contexts: [] }
    character: {}
};

// Recorrer todos los bloques
for (const story of cidm.stories) {
    for (const block of story.blocks || []) {
        // Estilo de párrafo
        if (block.styleId && !paragraphStyles[block.styleId]) {
            if (!audit.paragraph[block.styleId]) {
                audit.paragraph[block.styleId] = { count: 0, examples: [] };
            }
            audit.paragraph[block.styleId].count++;
            if (audit.paragraph[block.styleId].examples.length < 3) {
                audit.paragraph[block.styleId].examples.push(block.text);
            }
            // Contexto: bloque anterior y siguiente (si existen)
            const idx = story.blocks.indexOf(block);
            const prev = idx > 0 ? story.blocks[idx - 1].text : null;
            const next = idx < story.blocks.length - 1 ? story.blocks[idx + 1].text : null;
            audit.paragraph[block.styleId].context = {
                prev: prev ? prev.substring(0, 50) : null,
                next: next ? next.substring(0, 50) : null
            };
        }

        // Estilos de carácter en fragmentos
        for (const frag of block.fragments || []) {
            const fragStyleId = frag.styleId || frag.characterStyleId;
            if (fragStyleId && !characterStyles[fragStyleId]) {
                if (!audit.character[fragStyleId]) {
                    audit.character[fragStyleId] = { count: 0, examples: [] };
                }
                audit.character[fragStyleId].count++;
                if (audit.character[fragStyleId].examples.length < 3) {
                    audit.character[fragStyleId].examples.push(frag.text);
                }
            }
        }
    }
}

// Obtener nativeName desde styleDictionary
function getNativeName(styleId) {
    const entry = cidm.styleDictionary?.[styleId];
    return entry ? entry.nativeName || entry.name || '' : '';
}

// Imprimir informe
console.log('=== FORENSIC AUDIT: UNMAPPED PARAGRAPH STYLES ===\n');
for (const [styleId, info] of Object.entries(audit.paragraph)) {
    console.log(`Style ID: ${styleId}`);
    console.log(`Native Name: ${getNativeName(styleId)}`);
    console.log(`Uses: ${info.count}`);
    console.log(`Examples:`);
    info.examples.forEach((ex, i) => console.log(`  ${i+1}: "${ex.substring(0, 80)}${ex.length > 80 ? '...' : ''}"`));
    console.log(`Context (prev/next):`);
    console.log(`  Prev: ${info.context?.prev ? `"${info.context.prev}"` : 'N/A'}`);
    console.log(`  Next: ${info.context?.next ? `"${info.context.next}"` : 'N/A'}`);
    console.log('-----------------------------------\n');
}

console.log('\n=== FORENSIC AUDIT: UNMAPPED CHARACTER STYLES ===\n');
for (const [styleId, info] of Object.entries(audit.character)) {
    console.log(`Style ID: ${styleId}`);
    console.log(`Native Name: ${getNativeName(styleId)}`);
    console.log(`Uses: ${info.count}`);
    console.log(`Examples:`);
    info.examples.forEach((ex, i) => console.log(`  ${i+1}: "${ex.substring(0, 80)}${ex.length > 80 ? '...' : ''}"`));
    console.log('-----------------------------------\n');
}