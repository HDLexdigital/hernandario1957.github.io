/**
 * core/constructorXHTML.js
 * Genera XHTML5 accesible para macroestructuras editoriales completas (EPUB3).
 */
const { escaparHTML, normalizarClase } = require('../utils/textUtils');

function construirEstructura(tokens, tituloOriginal, nombreCSS = "Lexdigital_Modular.css") {
    const tituloDoc = tituloOriginal ? tituloOriginal.replace(/\.[^/.]+$/, "") : "Obra Jurídica";
    const cuerpoContent = [];
    const pilaEtiquetas = [];

    const cerrarNiveles = (hastaNivel) => {
        while (pilaEtiquetas.length > 0 && pilaEtiquetas[pilaEtiquetas.length - 1].nivel >= hastaNivel) {
            const etiqueta = pilaEtiquetas.pop();
            cuerpoContent.push(`</${etiqueta.nombre}>`);
        }
    };

    tokens.forEach((token) => {
        const id = `token-${token.indice}`;
        const claseEstilo = normalizarClase(token.estilo_indesign);
        
        let textoProcesado = '';
        if (token.fragmentos && token.fragmentos.length > 0) {
            textoProcesado = token.fragmentos.map(f => {
                let t = escaparHTML(f.texto);
                if (f.bold) t = `<strong>${t}</strong>`;
                if (f.italic) t = `<em>${t}</em>`;
                return t;
            }).join('');
        } else {
            textoProcesado = escaparHTML(token.texto_limpio || token.texto_completo || '');
        }

        switch (token.tipo) {
            // Páginas Preliminares
            case 'preliminar_portada':
                cuerpoContent.push(`<section id="${id}" epub:type="cover" class="${claseEstilo}"><h1 role="doc-title">${textoProcesado}</h1></section>`);
                break;
            case 'preliminar_portadilla':
                cuerpoContent.push(`<section id="${id}" epub:type="halftitle" class="${claseEstilo}"><p role="doc-subtitle">${textoProcesado}</p></section>`);
                break;
            case 'preliminar_legal':
                cuerpoContent.push(`<section id="${id}" epub:type="copyright-page" class="${claseEstilo}"><div role="contentinfo">${textoProcesado}</div></section>`);
                break;
            case 'preliminar_indice':
                cuerpoContent.push(`<nav id="${id}" epub:type="toc" role="doc-toc" class="${claseEstilo}"><h2>Índice</h2><p>${textoProcesado}</p></nav>`);
                break;
            case 'preliminar_prologo':
                cuerpoContent.push(`<section id="${id}" epub:type="preface" class="${claseEstilo}"><h2 role="heading" aria-level="2">${textoProcesado}</h2>`);
                pilaEtiquetas.push({ nombre: 'section', nivel: 1 });
                break;
            case 'seccion_actualizacion':
                cuerpoContent.push(`<section id="${id}" epub:type="notice" class="${claseEstilo}"><h3 role="heading" aria-level="3">${textoProcesado}</h3></section>`);
                break;

            // Cuerpo Macro
            case 'libro':
                cerrarNiveles(1);
                cuerpoContent.push(`<section id="libro-${id}" epub:type="volume"><h1 id="${id}" class="${claseEstilo}" role="heading" aria-level="1">${textoProcesado}</h1>`);
                pilaEtiquetas.push({ nombre: 'section', nivel: 1 });
                break;
            case 'titulo_parte':
                cerrarNiveles(2);
                cuerpoContent.push(`<section id="parte-${id}" epub:type="part"><h2 id="${id}" class="${claseEstilo}" role="heading" aria-level="2">${textoProcesado}</h2>`);
                pilaEtiquetas.push({ nombre: 'section', nivel: 2 });
                break;
            case 'capitulo':
                cerrarNiveles(3);
                cuerpoContent.push(`<section id="capitulo-${id}" epub:type="chapter"><h3 id="${id}" class="${claseEstilo}" role="heading" aria-level="3">${textoProcesado}</h3>`);
                pilaEtiquetas.push({ nombre: 'section', nivel: 3 });
                break;
            case 'seccion':
                cerrarNiveles(4);
                cuerpoContent.push(`<section id="seccion-${id}" epub:type="section"><h4 id="${id}" class="${claseEstilo}" role="heading" aria-level="4">${textoProcesado}</h4>`);
                pilaEtiquetas.push({ nombre: 'section', nivel: 4 });
                break;
            case 'articulo':
                cerrarNiveles(5);
                cuerpoContent.push(`<article id="${id}" class="articulo-contenedor" epub:type="article"><p id="p-${id}" class="${claseEstilo} articulo-p">${textoProcesado}</p>`);
                pilaEtiquetas.push({ nombre: 'article', nivel: 5 });
                break;
            case 'inciso':
                cuerpoContent.push(`<p id="${id}" class="${claseEstilo} inciso-sub" role="paragraph" epub:type="list-item">${textoProcesado}</p>`);
                break;
            case 'glosario_titulo':
                cerrarNiveles(1);
                cuerpoContent.push(`<section id="glosario" epub:type="backmatter"><h2 id="${id}" class="${claseEstilo}" role="heading" aria-level="2">${textoProcesado}</h2>`);
                pilaEtiquetas.push({ nombre: 'section', nivel: 1 });
                break;
            default:
                cuerpoContent.push(`<p id="${id}" class="${claseEstilo}" role="paragraph">${textoProcesado}</p>`);
                break;
        }
    });

    cerrarNiveles(0);

    return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="es" lang="es">
<head>
    <meta charset="utf-8" />
    <title>${escaparHTML(tituloDoc)}</title>
    <link rel="stylesheet" type="text/css" href="../../estilos/${nombreCSS}" />
</head>
<body epub:type="bodymatter">
    ${cuerpoContent.join('\n    ')}
</body>
</html>`;
}

module.exports = { construirEstructura };