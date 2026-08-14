/**
 * core/motorGrepJuridico.js
 * Motor centralizado que lee dinámicamente las reglas GREP sincronizadas desde InDesign.
 */
const fs = require('fs');
const path = require('path');

// 1. Reglas base inquebrantables del sistema jurídico
const REGLAS_BASE = [
    {
        patron: /^(PORTADA|FALSA\s+PORTADA)$/i,
        tipo: 'preliminar_portada',
        epubType: 'cover',
        nivelHtml: 1
    },
    {
        patron: /^PÁGINA\s+LEGAL$/i,
        tipo: 'preliminar_legal',
        epubType: 'copyright-page',
        nivelHtml: 1
    },
    {
        patron: /^ÍNDICE(?:\s+DE\s+CONTENIDO)?$/i,
        tipo: 'preliminar_indice',
        epubType: 'toc',
        nivelHtml: 1
    },
    {
        patron: /^(INTRODUCCIÓN|PREFACIO|PRÓLOGO|PRESENTACIÓN)$/i,
        tipo: 'preliminar_prologo',
        epubType: 'preface',
        nivelHtml: 1
    },
    {
        patron: /^LIBRO\s+[IVXLCDM]+\b/i,
        tipo: 'libro',
        epubType: 'volume',
        nivelHtml: 1
    },
    {
        patron: /^TÍTULO\s+[IVXLCDM]+\b/i,
        tipo: 'titulo_parte',
        epubType: 'part',
        nivelHtml: 2
    },
    {
        patron: /^CAPÍTULO\s+[IVXLCDM]+\b/i,
        tipo: 'capitulo',
        epubType: 'chapter',
        nivelHtml: 3
    },
    {
        patron: /^SECCIÓN\s+[IVXLCDM]+\b/i,
        tipo: 'seccion',
        epubType: 'section',
        nivelHtml: 4
    },
    {
        patron: /^Artículo\s+\d+/i,
        tipo: 'articulo',
        epubType: 'article',
        nivelHtml: 5
    },
    {
        patron: /^Parágrafo(?:\s+transitorio)?(?:\s+\d+|\s+nuevo)?\.?/i,
        tipo: 'paragrafo_normativo',
        epubType: 'notice',
        nivelHtml: 6
    },
    {
        patron: /^(?:[a-z]\)|\d+\.\d+)\s+/i,
        tipo: 'inciso',
        epubType: 'list-item',
        nivelHtml: 6
    },
    {
        patron: /^GLOSARIO$/i,
        tipo: 'glosario_titulo',
        epubType: 'backmatter',
        nivelHtml: 2
    }
];

/**
 * Función que lee dinámicamente el archivo .txt exportado por InDesign
 * desde la ruta donde el usuario decidió guardarlo.
 */
function cargarReglasDinamicas() {
    let reglasDinamicas = [];
    
    // Ruta relativa a la carpeta 'config/' dentro de tu proyecto modular
    // (Asegúrate de guardar allí el .txt cuando el script de InDesign te pregunte dónde ubicarlo)
    const rutaTxtPersonalizada = path.join(__dirname, '../config/ReglasGrepJuridicas.txt');

    if (fs.existsSync(rutaTxtPersonalizada)) {
        try {
            const contenido = fs.readFileSync(rutaTxtPersonalizada, 'utf-8');
            const lineas = contenido.split(/\r?\n/);

            lineas.forEach(linea => {
                if (linea.trim() !== '') {
                    const partes = linea.split('|');
                    if (partes.length === 2) {
                        const tipoExtraido = partes[0].replace('TIPO:', '').trim();
                        let patronTexto = partes[1].replace('PATRON:', '').trim();

                        let flags = '';
                        if (patronTexto.endsWith('/i')) {
                            flags = 'i';
                            patronTexto = patronTexto.slice(1, -2);
                        } else if (patronTexto.startsWith('/') && patronTexto.endsWith('/')) {
                            patronTexto = patronTexto.slice(1, -1);
                        }

                        reglasDinamicas.push({
                            patron: new RegExp(patronTexto, flags),
                            tipo: tipoExtraido,
                            epubType: 'notice',
                            nivelHtml: 6
                        });
                    }
                }
            });
        } catch (e) {
            console.warn('⚠️ Advertencia al leer reglas dinámicas:', e.message);
        }
    }

    // Retorna la unión de las reglas dinámicas + las reglas base
    return [...reglasDinamicas, ...REGLAS_BASE];
}

function evaluarTokenConGrep(texto) {
    const textoLimpio = (texto || '').trim();
    const reglasActivas = cargarReglasDinamicas(); // Carga sincronizada al vuelo

    for (const regla of reglasActivas) {
        if (regla.patron.test(textoLimpio)) {
            return {
                tipo: regla.tipo,
                epubType: regla.epubType,
                nivelHtml: regla.nivelHtml,
                coincidioGrep: true
            };
        }
    }

    return {
        tipo: 'texto_cuerpo',
        epubType: 'body',
        nivelHtml: 6,
        coincidioGrep: false
    };
}

module.exports = { evaluarTokenConGrep };