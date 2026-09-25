const fs = require('fs');
const path = require('path');
const adapterPath = '/home/donache/hernandario1957.github.io/src/adaptadores/InDesignAdapter.js';

let code = fs.readFileSync(adapterPath, 'utf8');

// Reemplazar la sección que construye styleBridge para soportar la estructura real de paragraphStyles/characterStyles
const oldBridgeLogic = `        semMap.styles.forEach(style => {
            const name = style.originalName;
            const type = style.type;
            if (name && style.exportTagging && style.exportTagging.epub) {
                styleBridge[name] = {
                    className: style.exportTagging.epub.className || null,
                    tag: style.exportTagging.epub.tag || null,
                    presentation: style.presentation || null
                };
                if (type === 'paragraph') mappedParagraphs.add(name);
                if (type === 'character') mappedCharacters.add(name);
            }
        });`;

const newBridgeLogic = `        // Soporte robusto para paragraphStyles y characterStyles del style-model.json
        const processStylesCollection = (collection, type) => {
            if (!collection) return;
            for (const style of Object.values(collection)) {
                const name = style?.metadata?.originalName;
                const epubTag = style?.exportTagging?.epub || style?.semantic;
                if (name) {
                    styleBridge[name] = {
                        className: epubTag?.className || style?.semantic?.class || null,
                        tag: epubTag?.tag || style?.semantic?.tag || 'p',
                        presentation: style?.presentation || null
                    };
                    if (type === 'paragraph') mappedParagraphs.add(name);
                    if (type === 'character') mappedCharacters.add(name);
                }
            }
        };

        if (Array.isArray(semMap.styles)) {
            semMap.styles.forEach(style => {
                const name = style.originalName;
                const type = style.type;
                if (name) {
                    styleBridge[name] = {
                        className: style?.exportTagging?.epub?.className || null,
                        tag: style?.exportTagging?.epub?.tag || 'p',
                        presentation: style?.presentation || null
                    };
                    if (type === 'paragraph') mappedParagraphs.add(name);
                    if (type === 'character') mappedCharacters.add(name);
                }
            });
        }

        processStylesCollection(semMap.paragraphStyles, 'paragraph');
        processStylesCollection(semMap.characterStyles, 'character');`;

if (code.includes('semMap.styles.forEach')) {
    code = code.replace(oldBridgeLogic, newBridgeLogic);
    fs.writeFileSync(adapterPath, code);
    console.log('✅ InDesignAdapter.js: Puente de estilos actualizado para soportar paragraphStyles y characterStyles.');
} else {
    console.log('⚠️ No se encontró el bloque exacto, pero revisaremos la ejecución.');
}
