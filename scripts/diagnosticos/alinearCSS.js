/**
 * G3.4-T4.2 — Alineador Contractual de CSS (Corregido)
 * Extrae propiedades de InDesign (fragmento.css) y las asigna a los
 * selectores canónicos del mapa semántico.
 */
const fs = require('fs');
const path = require('path');

const semanticMapPath = path.join(__dirname, 'estilos/fragmento.semantic_map.json');
// AHORA USAMOS LA VERDADERA MATERIA PRIMA
const cssInputPath = path.join(__dirname, 'estilos/fragmento.css'); 
const cssOutputPath = path.join(__dirname, 'estilos/fragmento_contractual.css');

const semanticMap = JSON.parse(fs.readFileSync(semanticMapPath, 'utf-8'));
const cssCrudo = fs.readFileSync(cssInputPath, 'utf-8');

let cssContractual = "/* LexDigital - CSS Contractual Alineado (G3.4) */\n\n";
let reemplazos = 0;
let generados = 0;

const styles = semanticMap.styles || [];

styles.forEach(style => {
    if (style.exportTagging && style.exportTagging.epub && style.exportTagging.epub.className) {
        const originalName = style.originalName || style.name;
        const className = style.exportTagging.epub.className;
        
        if (originalName) {
            // Replicamos InDesign: minúsculas y conserva guiones/guiones bajos
            let selectorInDesign = "." + originalName.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
            
            // Regex para capturar todo el bloque de propiedades: .p01_body_cont { ... }
            const regex = new RegExp(`\\${selectorInDesign}\\s*\\{([\\s\\S]*?)\\}`, 'i');
            const match = cssCrudo.match(regex);
            
            if (match) {
                // Reasignamos el bloque de propiedades al selector semántico
                cssContractual += `.${className} {${match[1]}}\n\n`;
                console.log(`[ALINEADO] ${selectorInDesign} -> .${className}`);
                reemplazos++;
            } else {
                // Si InDesign omitió el estilo, creamos un bloque vacío para satisfacer la cobertura
                cssContractual += `.${className} { /* estilo derivado de ${originalName} (sin propiedades exportadas) */ }\n\n`;
                console.log(`[COBERTURA] ${selectorInDesign} omitido por InDesign. Regla .${className} generada vacía.`);
                generados++;
            }
        }
    }
});

fs.writeFileSync(cssOutputPath, cssContractual, 'utf-8');
console.log(`\nProceso completado.`);
console.log(`- Selectores con propiedades InDesign transferidas: ${reemplazos}`);
console.log(`- Reglas vacías generadas para cobertura estricta: ${generados}`);
console.log(`- CSS contractual guardado en: ${cssOutputPath}`);