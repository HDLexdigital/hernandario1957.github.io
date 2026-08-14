/**
 * G3.5-T0 — Auditoría Forense de Fidelidad Editorial (Fotografía Base)
 * Analiza el XHTML generado por el pipeline exitoso (Código 0) para medir
 * los invariantes de estructura, texto y estilos.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Asegúrate de que esta ruta apunte al XHTML que genera tu test de producción
const xhtmlPath = path.join(__dirname, 'salidaXHTML/index.xhtml');

if (!fs.existsSync(xhtmlPath)) {
    console.error(`[ERROR] No se encontró el archivo XHTML en: ${xhtmlPath}`);
    console.error('Por favor, ajusta la ruta o ejecuta primero el test de producción para generarlo.');
    process.exit(1);
}

const xhtmlContent = fs.readFileSync(xhtmlPath, 'utf-8');
// Usamos el parser HTML tolerante para ignorar el error de raíz múltiple y poder contar los nodos
const dom = new JSDOM(xhtmlContent);
const document = dom.window.document;

console.log('=== G3.5-T0: AUDITORÍA DE FIDELIDAD EDITORIAL (XHTML) ===\n');

// 1. INVARIANTE F2: Conteo de Párrafos
const parrafos = document.querySelectorAll('p');
console.log(`[F2] Párrafos totales encontrados en XHTML (|P_X|): ${parrafos.length}`);

// 2. INVARIANTE F1: Longitud del Texto Concatenado
// Extraemos el textContent de todos los párrafos para simular T_XHTML
let textoConcatenado = '';
parrafos.forEach(p => {
    textoConcatenado += p.textContent || '';
});
console.log(`[F1] Longitud total del texto en párrafos (T_XHTML): ${textoConcatenado.length} caracteres`);

// 3. INVARIANTE F3: Clases de Párrafo Utilizadas
const clasesParrafo = new Set();
parrafos.forEach(p => {
    if (p.className) {
        // Puede haber múltiples clases en un nodo, las separamos
        p.className.split(/\s+/).forEach(cls => clasesParrafo.add(cls));
    } else {
        clasesParrafo.add('[SIN CLASE]');
    }
});
console.log(`[F3] Clases de párrafo detectadas:`, Array.from(clasesParrafo));

// 4. INVARIANTE F4: Elementos de Fragmentación (Estilos de Carácter)
// Buscamos etiquetas en línea típicas (span, strong, em, b, i) dentro de los párrafos
const elementosInline = document.querySelectorAll('p span, p strong, p em, p b, p i');
const clasesCaracter = new Set();
elementosInline.forEach(el => {
    if (el.className) {
        el.className.split(/\s+/).forEach(cls => clasesCaracter.add(cls));
    } else {
        clasesCaracter.add(`[SIN CLASE - Etiqueta: ${el.tagName.toLowerCase()}]`);
    }
});
console.log(`[F4] Nodos de fragmentación (runs) encontrados: ${elementosInline.length}`);
if (elementosInline.length > 0) {
    console.log(`[F4] Clases de carácter detectadas:`, Array.from(clasesCaracter));
}

console.log('\n=========================================================');
console.log('FOTOGRAFÍA COMPLETADA. Evaluar contra los valores de InDesign/AST.');