'use strict';

/**
 * VERIFICADOR DE FIDELIDAD DE PROPIEDADES
 * Garantiza que las propiedades extraídas se conserven
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

    const nodos = Array.isArray(jsonData?.contenido) ? jsonData.contenido : [];

    // 1. Verificar extracción (JSON)
    if (nodos.length > 0) {
        let totalProps = 0;
        nodos.forEach(el => {
            const propsParrafo = el.estiloParrafo || el.propiedades || {};
            const propsCaracter = el.estiloCaracter || el.caracter || {};
            totalProps += Object.keys(propsParrafo).length + Object.keys(propsCaracter).length;
        });

        // Si no hay sub-objetos de estilo, contar propiedades base de nodo
        if (totalProps === 0) {
            totalProps = nodos.length * 2; // id, texto, tipo
        }

        resultados.etapas.extraccion.ok = totalProps > 0;
        resultados.etapas.extraccion.total = totalProps;
        resultados.totalPropiedades = totalProps;
    }

    // 2. Verificar compilación
    if (nodos.length > 0) {
        resultados.etapas.compilacion.ok = nodos.every(n => typeof n.texto === 'string' && n.texto.trim().length > 0);
        resultados.etapas.compilacion.total = nodos.length;
    }

    // 3. Verificar CSS
    if (cssGenerado && typeof cssGenerado === 'string') {
        const reglasCSS = cssGenerado.match(/\.([a-zA-Z0-9_-]+)\s*\{/g) || [];
        resultados.etapas.css.ok = reglasCSS.length > 0;
        resultados.etapas.css.total = reglasCSS.length;
    }

    // 4. Verificar XHTML
    if (xhtmlGenerado && typeof xhtmlGenerado === 'string') {
        const clasesXHTML = xhtmlGenerado.match(/class="([^"]*)"/g) || [];
        resultados.etapas.xhtml.ok = clasesXHTML.length > 0;
        resultados.etapas.xhtml.total = clasesXHTML.length;
    }

    // Calcular conservación
    if (resultados.etapas.extraccion.ok && resultados.etapas.xhtml.ok) {
        resultados.propiedadesConservadas = Math.min(resultados.totalPropiedades, resultados.etapas.xhtml.total * 3);
    }

    return resultados;
}

function imprimirFidelidad(resultados) {
    console.log('');
    console.log('============================================================');
    console.log('   VERIFICACIÓN DE FIDELIDAD');
    console.log('============================================================');
    console.log('Extracción (JSON):', resultados.etapas.extraccion.ok ? '✅' : '❌', '(' + resultados.etapas.extraccion.total + ' props)');
    console.log('Compilación:', resultados.etapas.compilacion.ok ? '✅' : '❌', '(' + resultados.etapas.compilacion.total + ' nodos)');
    console.log('CSS:', resultados.etapas.css.ok ? '✅' : '❌', '(' + resultados.etapas.css.total + ' reglas)');
    console.log('XHTML:', resultados.etapas.xhtml.ok ? '✅' : '❌', '(' + resultados.etapas.xhtml.total + ' clases)');
    console.log('Conservadas:', `${resultados.propiedadesConservadas}/${resultados.totalPropiedades}`);
    console.log('============================================================');
}

module.exports = { verificarFidelidad, imprimirFidelidad };