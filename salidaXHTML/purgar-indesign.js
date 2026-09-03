#!/usr/bin/env node
const fs = require('fs');

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log("Uso: node purgar-indesign.js <archivo_entrada.html> [archivo_salida.html]");
    process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1] || inputFile.replace('.html', '_responsive.html').replace('.xhtml', '_responsive.xhtml');

try {
    let html = fs.readFileSync(inputFile, 'utf8');
    console.log(`\n▸ Procesando y adaptando para móviles: ${inputFile}`);

    // 1. Inyectar el Meta Viewport en el <head> si no existe
    const mobileMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />';
    if (!html.includes('name="viewport"')) {
        html = html.replace(/<head>/i, `<head>\n\t\t${mobileMeta}`);
    }

    // 2. Eliminar la hoja de estilos basura autogenerada por InDesign
    html = html.replace(/<link[^>]*href="[^"]*idGeneratedStyles\.css"[^>]*>\s*/gi, '');

    // 3. Eliminar el contenedor inútil principal (_idContainer000) y su cierre
    html = html.replace(/<div id="_idContainer000"[^>]*>\s*/gi, '');
    html = html.replace(/\s*<\/div>\s*<\/body>/gi, '\n\t</body>');

    // 4. Limpiar las clases "CharOverride"
    html = html.replace(/\s*CharOverride-\d+/gi, '');
    html = html.replace(/ class=""/gi, '');
    
    // Desenvolver span huérfanos
    html = html.replace(/<span\s*>(.*?)<\/span>/gis, '$1');

    // 5. Curar la "Spanitis" (fusión de etiquetas idénticas adyacentes)
    let previousHtml = "";
    let mergeCount = 0;
    while (previousHtml !== html) {
        previousHtml = html;
        html = html.replace(/(<span([^>]*)>)(.*?)<\/span>(\s*)<span\2>/gis, (match, p1, p2, p3, p4) => {
            mergeCount++;
            return p1 + p3 + p4; 
        });
    }

    // 6. Corregir semántica inválida (<dt> en <p>)
    html = html.replace(/<dt([^>]*)>/gi, '<span$1>');
    html = html.replace(/<\/dt>/gi, '</span>');

    // 7. Limpiar escapes de puntuación residuales
    html = html.replace(/\\\./g, '.');

    fs.writeFileSync(outputFile, html, 'utf8');
    
    console.log(`✔ Archivo adaptado y purgado con éxito.`);
    console.log(`  - Meta tag móvil inyectado.`);
    console.log(`  - Spans fusionados: ${mergeCount}`);
    console.log(`  - Guardado en: ${outputFile}\n`);

} catch (error) {
    console.error("\n❌ Error al procesar el archivo:", error.message);
}