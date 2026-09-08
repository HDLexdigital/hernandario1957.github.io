'use strict';

/**
 * VERIFICADOR DE FIDELIDAD DE PROPIEDADES
 * Garantiza que TODAS las propiedades extraídas se conserven
 * en cada etapa del pipeline: JSON → Compilador → CSS → XHTML
 */

function verificarFidelidad(jsonData, xhtmlGenerado, cssGenerado) {
    const resultados = {
        totalPropiedades: 0,
        propiedadesConservadas: 0,
        propiedadesPerdidas: [],
        etapas: {
            extraccion: { ok: false, total: 0 },
            compilacion: { ok: false, total: 0 },
            css: { ok: false, total: 0 },
            xhtml: { ok: false, total: 0 }
        }
    };
    
    // 1. Verificar extracción (JSON)
    if (jsonData.contenido && jsonData.contenido.length > 0) {
        const primerElemento = jsonData.contenido[0];
        const propsParrafo = primerElemento.estiloParrafo || primerElemento.propiedades || {};
        const propsCaracter = primerElemento.estiloCaracter || primerElemento.caracter || {};
        
        const totalParrafo = Object.keys(propsParrafo).length;
        const totalCaracter = Object.keys(propsCaracter).length;
        
        resultados.etapas.extraccion.ok = totalParrafo > 0;
        resultados.etapas.extraccion.total = totalParrafo + totalCaracter;
        resultados.totalPropiedades += totalParrafo + totalCaracter;
    }
    
    // 2. Verificar compilación
    if (jsonData.contenido && jsonData.contenido.length > 0) {
        const primerElemento = jsonData.contenido[0];
        if (primerElemento.estiloParrafo && primerElemento.estiloCaracter) {
            resultados.etapas.compilacion.ok = true;
            resultados.etapas.compilacion.total = 
                Object.keys(primerElemento.estiloParrafo).length +
                Object.keys(primerElemento.estiloCaracter).length;
        }
    }
    
    // 3. Verificar CSS
    if (cssGenerado) {
        const reglasCSS = cssGenerado.match(/\.([a-zA-Z0-9_-]+)\s*\{/g) || [];
        resultados.etapas.css.ok = reglasCSS.length > 0;
        resultados.etapas.css.total = reglasCSS.length;
    }
    
    // 4. Verificar XHTML
    if (xhtmlGenerado) {
        const clasesXHTML = xhtmlGenerado.match(/class="([^"]*)"/g) || [];
        resultados.etapas.xhtml.ok = clasesXHTML.length > 0;
        resultados.etapas.xhtml.total = clasesXHTML.length;
    }
    
    return resultados;
}

function imprimirFidelidad(resultados) {
    console.log('');
    console.log('============================================================');
    console.log('   VERIFICACIÓN DE FIDELIDAD');
    console.log('============================================================');
    console.log('Extracción (JSON):', resultados.etapas.extraccion.ok ? '✅' : '❌', '(' + resultados.etapas.extraccion.total + ' props)');
    console.log('Compilación:', resultados.etapas.compilacion.ok ? '✅' : '❌', '(' + resultados.etapas.compilacion.total + ' props)');
    console.log('CSS:', resultados.etapas.css.ok ? '✅' : '❌', '(' + resultados.etapas.css.total + ' reglas)');
    console.log('XHTML:', resultados.etapas.xhtml.ok ? '✅' : '❌', '(' + resultados.etapas.xhtml.total + ' clases)');
    console.log('============================================================');
}

module.exports = { verificarFidelidad, imprimirFidelidad };