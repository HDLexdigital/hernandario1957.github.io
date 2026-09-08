'use strict';
/**
 * Auditoría CSS integrada en el pipeline
 * Verifica que el CSS generado cumpla con el contrato normativo
 */
const fs = require('fs');
function auditarCSS(cssGenerado, xhtmlCompleto) {
    const resultados = {
        totalReglas: 0,
        reglasValidas: 0,
        reglasInvalidas: 0,
        propiedades: {
            fontFamily: 0,
            fontSize: 0,
            color: 0,
            marginTop: 0,
            marginBottom: 0,
            paddingLeft: 0,
            textIndent: 0
        },
        errores: [],
        advertencias: []
    };
    // 1. Verificar que el CSS no esté vacío
    if (!cssGenerado || cssGenerado.trim().length === 0) {
        resultados.errores.push('CSS vacío - no se generaron reglas');
        return resultados;
    }
    // 2. Contar reglas CSS
    const reglas = cssGenerado.match(/\.([a-z0-9-_]+)\s*\{/g) || [];
    resultados.totalReglas = reglas.length;
    // 3. Verificar propiedades
    if (cssGenerado.includes('font-family')) resultados.propiedades.fontFamily++;
    if (cssGenerado.includes('font-size')) resultados.propiedades.fontSize++;
    if (cssGenerado.includes('color:')) resultados.propiedades.color++;
    if (cssGenerado.includes('margin-top')) resultados.propiedades.marginTop++;
    if (cssGenerado.includes('margin-bottom')) resultados.propiedades.marginBottom++;
    if (cssGenerado.includes('padding-left')) resultados.propiedades.paddingLeft++;
    if (cssGenerado.includes('text-indent')) resultados.propiedades.textIndent++;
    // 4. Verificar valores inválidos
    if (cssGenerado.includes('color: TITULO') || cssGenerado.includes('color: Cap')) {
        resultados.errores.push('Color inválido detectado (falta comillas o #)');
    }
    if (cssGenerado.includes('undefined')) {
        resultados.errores.push('Valor undefined detectado');
    }
    if (cssGenerado.includes('NaN')) {
        resultados.errores.push('Valor NaN detectado');
    }
    // 5. Verificar decimales excesivos
    const decimalesExcesivos = cssGenerado.match(/\d+\.\d{4,}/g) || [];
    if (decimalesExcesivos.length > 0) {
        resultados.advertencias.push(decimalesExcesivos.length + ' valores con decimales excesivos');
    }
    // 6. Verificar que las clases CSS existan en el XHTML
    const clasesCSS = cssGenerado.match(/\.([a-z0-9-_]+)\s*\{/g) || [];
    for (const regla of clasesCSS) {
        const clase = regla.replace(/[.\s{]/g, '');
        if (xhtmlCompleto && xhtmlCompleto.includes('class="' + clase + '"')) {
            resultados.reglasValidas++;
        } else {
            resultados.advertencias.push('Clase .' + clase + ' definida pero no usada en XHTML');
        }
    }
    resultados.reglasInvalidas = resultados.totalReglas - resultados.reglasValidas;
    return resultados;
}
function imprimirReporteAuditoria(resultados) {
    console.log('');
    console.log('============================================================');
    console.log('   AUDITORÍA CSS - RESULTADO');
    console.log('============================================================');
    console.log('Total reglas: ' + resultados.totalReglas);
    console.log('Reglas válidas: ' + resultados.reglasValidas);
    console.log('Reglas inválidas: ' + resultados.reglasInvalidas);
    console.log('');
    console.log('Propiedades:');
    console.log('  font-family: ' + resultados.propiedades.fontFamily);
    console.log('  font-size: ' + resultados.propiedades.fontSize);
    console.log('  color: ' + resultados.propiedades.color);
    console.log('  margin-top: ' + resultados.propiedades.marginTop);
    console.log('  margin-bottom: ' + resultados.propiedades.marginBottom);
    console.log('  padding-left: ' + resultados.propiedades.paddingLeft);
    console.log('  text-indent: ' + resultados.propiedades.textIndent);
    console.log('');
    if (resultados.errores.length > 0) {
        console.log('ERRORES:');
        resultados.errores.forEach(e => console.log('  ❌ ' + e));
    }
    if (resultados.advertencias.length > 0) {
        console.log('ADVERTENCIAS:');
        resultados.advertencias.forEach(a => console.log('  ⚠️ ' + a));
    }
    console.log('============================================================');
}
module.exports = { auditarCSS, imprimirReporteAuditoria };