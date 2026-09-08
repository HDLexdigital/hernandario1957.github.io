const fs = require('fs');
const xhtml = fs.readFileSync('salidaXHTML/decreto252_FINAL.xhtml', 'utf8');
// Verificar si hay CSS inyectado
const tieneStyleTag = xhtml.includes('<style>');
const tieneCSSComentario = xhtml.includes('CSS generado desde propiedades');
// Verificar colores (solo si hay propiedades de color)
const tieneColorConComillas = xhtml.includes('color: "');
const tieneColorHex = xhtml.includes('color: #');
// Verificar si no hay colores inválidos
const tieneColorInvalido = /color:\s*[A-Za-z]+\s*;/.test(xhtml);
console.log('=== VERIFICACION CSS MEJORADA ===');
console.log('Tiene <style>:', tieneStyleTag);
console.log('Tiene comentario CSS:', tieneCSSComentario);
console.log('Color con comillas:', tieneColorConComillas);
console.log('Color hex:', tieneColorHex);
console.log('Color invalido (sin comillas):', tieneColorInvalido);
console.log('');
console.log('Tamano:', xhtml.length, 'bytes');
// Mostrar el CSS si existe
const inicioCSS = xhtml.indexOf('<style>');
if (inicioCSS > 0) {
    const finCSS = xhtml.indexOf('</style>') + 8;
    console.log('');
    console.log('=== CSS EN EL XHTML ===');
    console.log(xhtml.substring(inicioCSS, finCSS).substring(0, 500));
}