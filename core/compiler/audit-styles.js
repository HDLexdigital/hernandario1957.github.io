'use strict';

const fs = require('fs');
const path = require('path');

// Rutas dinámicas e independientes del sistema operativo
const cidmPath = path.join(__dirname, '..', 'integration', 'fixtures', 'authentic', 'CIDM_real.json');
const mapPath = path.join(__dirname, 'mappings', 'semantic-map.json');

if (!fs.existsSync(cidmPath)) {
    console.error(`❌ No se encontró el CIDM real en: ${cidmPath}`);
    process.exit(1);
}
if (!fs.existsSync(mapPath)) {
    console.error(`❌ No se encontró el mapa semántico en: ${mapPath}`);
    process.exit(1);
}

const cidm = JSON.parse(fs.readFileSync(cidmPath, 'utf8'));
const semanticMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const paragraphStyles = semanticMap.paragraphStyles || {};
const characterStyles = semanticMap.characterStyles || {};

const unmappedParagraphs = new Map(); // styleId -> nativeName
const unmappedCharacters = new Map();

// Helper para obtener nativeName del styleDictionary
function getNativeName(styleId) {
    if (!cidm.styleDictionary || !cidm.styleDictionary[styleId]) {
        return null;
    }
    return cidm.styleDictionary[styleId].nativeName || cidm.styleDictionary[styleId].name || null;
}

// Escaneo forense de los bloques
let totalParagraphStyles = 0;
let totalCharacterStyles = 0;

for (const story of cidm.stories) {
    const blocks = story.blocks || story.paragraphs || [];
    for (const block of blocks) {
        // 1. Auditar estilo de párrafo
        if (block.styleId) {
            totalParagraphStyles++;
            if (!paragraphStyles[block.styleId]) {
                unmappedParagraphs.set(block.styleId, getNativeName(block.styleId));
            }
        }

        // 2. Auditar estilos de carácter en los fragmentos
        const fragments = block.fragments || [];
        for (const frag of fragments) {
            const fragStyleId = frag.styleId || frag.characterStyleId;
            if (fragStyleId) {
                totalCharacterStyles++;
                if (!characterStyles[fragStyleId]) {
                    unmappedCharacters.set(fragStyleId, getNativeName(fragStyleId));
                }
            }
        }
    }
}

// Generar reporte
console.log('🔎 --- REPORTE DE AUDITORÍA SEMÁNTICA --- 🔎\n');

console.log(`Estilos de párrafo usados: ${totalParagraphStyles}`);
console.log(`Estilos de párrafo mapeados: ${Object.keys(paragraphStyles).length}`);
console.log(`Faltan en paragraphStyles: ${unmappedParagraphs.size}`);

if (unmappedParagraphs.size === 0) {
    console.log('  ✅ Todos los párrafos están mapeados.');
} else {
    for (const [styleId, nativeName] of unmappedParagraphs.entries()) {
        const hint = nativeName ? ` (nativeName: "${nativeName}")` : '';
        console.log(`    "${styleId}": { "semanticType": "paragraph" }${hint}, // TODO: Ajustar tipo real`);
    }
}

console.log(`\nEstilos de carácter usados: ${totalCharacterStyles}`);
console.log(`Estilos de carácter mapeados: ${Object.keys(characterStyles).length}`);
console.log(`Faltan en characterStyles: ${unmappedCharacters.size}`);

if (unmappedCharacters.size === 0) {
    console.log('  ✅ Todos los caracteres están mapeados.');
} else {
    for (const [styleId, nativeName] of unmappedCharacters.entries()) {
        const hint = nativeName ? ` (nativeName: "${nativeName}")` : '';
        console.log(`    "${styleId}": { "semanticType": "text" }${hint}, // TODO: Ajustar tipo real`);
    }
}

console.log('\n=============================================');

// Salida con error si hay estilos sin mapear (útil para CI)
if (unmappedParagraphs.size > 0 || unmappedCharacters.size > 0) {
    console.error('❌ Existen estilos sin mapear. Complete el semantic-map.json antes de continuar.');
    process.exit(1);
} else {
    console.log('✅ Auditoría superada: todos los estilos usados están mapeados.');
    process.exit(0);
}