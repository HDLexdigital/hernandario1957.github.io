/**
 * src/adaptadores/adaptadorCSS.js
 * Genera la hoja de estilos CSS en estilos/ a partir de style_model.json
 */
const fs = require('fs');
const path = require('path');

function generarCSS(styleModel, rutaSalida) {
    if (!styleModel || !styleModel.paragraphStyles) return;

    let cssBuffer = ["/* LexDigital - CSS Final de Publicación */\n"];
    const pStyles = styleModel.paragraphStyles;

    for (let id in pStyles) {
        if (pStyles.hasOwnProperty(id)) {
            const st = pStyles[id];
            if (st.metadata && st.metadata.isRoot) continue;

            // Sanitizar selector de clase
            let selector = "." + (st.metadata.originalName || id)
                .replace(/\[|\]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9_-]/g, "-");

            const res = st.resolved || {};
            cssBuffer.push(`${selector} {`);
            if (res.fontFamily) cssBuffer.push(`  font-family: "${res.fontFamily}", serif;`);
            if (res.pointSize) cssBuffer.push(`  font-size: ${res.pointSize};`);
            if (res.leading) cssBuffer.push(`  line-height: ${res.leading};`);
            if (res.fillColor) cssBuffer.push(`  color: ${res.fillColor};`);
            if (res.spaceBefore && res.spaceBefore !== "0pt") cssBuffer.push(`  margin-top: ${res.spaceBefore};`);
            if (res.spaceAfter && res.spaceAfter !== "0pt") cssBuffer.push(`  margin-bottom: ${res.spaceAfter};`);
            if (res.firstLineIndent && res.firstLineIndent !== "0pt") cssBuffer.push(`  text-indent: ${res.firstLineIndent};`);
            cssBuffer.push("}\n");
        }
    }

    fs.writeFileSync(rutaSalida, cssBuffer.join("\n"), 'utf-8');
}

module.exports = { generarCSS };