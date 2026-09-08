'use strict';

class IndesignAstAdapter {
    static normalizar(jsonCrudo, semanticMap = null) {
        if (!jsonCrudo || typeof jsonCrudo !== 'object') {
            throw new TypeError("jsonCrudo debe ser un objeto válido");
        }

        const metadatos = {
            titulo: jsonCrudo.documento?.titulo || jsonCrudo.document?.metadata?.title || 'Documento LexCodex',
            idioma: jsonCrudo.documento?.idioma || 'es'
        };

        let jsonNormalizado = JSON.parse(JSON.stringify(jsonCrudo));
        let nodosExtraidos = [];

        // 1. DETECCIÓN UNIVERSAL DEL DIALECTO (Atrapa cualquier estructura exportada por InDesign/UXP)
        if (Array.isArray(jsonNormalizado.parrafos)) {
            nodosExtraidos = jsonNormalizado.parrafos;
        } else if (Array.isArray(jsonNormalizado.tokens)) {
            nodosExtraidos = jsonNormalizado.tokens;
        } else if (Array.isArray(jsonNormalizado.contenido)) {
            nodosExtraidos = jsonNormalizado.contenido;
        } else if (Array.isArray(jsonNormalizado.fragmentos)) {
            nodosExtraidos = jsonNormalizado.fragmentos;
        } else if (jsonNormalizado.body && Array.isArray(jsonNormalizado.body)) {
            jsonNormalizado.body.forEach(story => {
                if (Array.isArray(story.children)) {
                    nodosExtraidos = nodosExtraidos.concat(story.children);
                }
            });
        } else if (Array.isArray(jsonNormalizado)) {
            nodosExtraidos = jsonNormalizado;
        }

        // 2. PROCESAMIENTO Y NORMALIZACIÓN DE NODOS
        function procesarNodo(nodo) {
            if (!nodo || typeof nodo !== 'object') return;

            // Unificar propiedades de estilo
            let estiloParaPuente = nodo.estilo || nodo.estiloParrafo || nodo.inDesignStyle || nodo.style || 'P01_BODY_BASE';
            
            // Extraer el texto base de forma segura
            let textoExtraido = nodo.texto ?? nodo.textoPlano ?? nodo.texto_completo ?? nodo.text ?? "";
            
            // Unificar hijos o fragmentos
            let fragmentosFuente = nodo.fragmentos || nodo.children || [];
            if (!textoExtraido && Array.isArray(fragmentosFuente)) {
                textoExtraido = fragmentosFuente.map(f => f.texto || f.text || '').join('');
            }

            if (typeof textoExtraido === 'string') {
                textoExtraido = textoExtraido.replace(/[\r\n]+/g, ' ').trim();
            }

            nodo.texto = textoExtraido === "" ? "[VACÍO]" : textoExtraido;
            nodo.textoPlano = nodo.texto;

            // REGLAS INTELIGENTES: Preámbulo y Capítulos
            const textoUpper = (nodo.texto !== '[VACÍO]' ? nodo.texto.toUpperCase() : '');
            if (textoUpper === 'PREÁMBULO') {
                estiloParaPuente = 'P03_CENTER_BOLD';
            } else if (textoUpper.startsWith('CAPÍTULO') || textoUpper.startsWith('CAPITULO')) {
                estiloParaPuente = 'P02_TITLE_CHAPTER';
                // Si el capítulo vino sin fragmentos detectados, forzamos la negrita
                if (fragmentosFuente.length === 0) {
                    fragmentosFuente = [{
                        texto: nodo.texto,
                        estiloCaracter: '[Ninguno]',
                        formatoDirecto: { negrita: true }
                    }];
                }
            }

            nodo.estilo = estiloParaPuente;
            nodo.estiloParrafo = estiloParaPuente;

            // Estandarizar la estructura interna de los fragmentos (spans)
            if (Array.isArray(fragmentosFuente)) {
                nodo.fragmentos = fragmentosFuente.map(frag => {
                    return {
                        texto: frag.texto || frag.text || '',
                        estiloCaracter: frag.estiloCaracter || frag.characterStyle || '[Ninguno]',
                        formatoDirecto: {
                            negrita: frag.formatoDirecto?.negrita || frag.format?.capitalization === 'BOLD' || false
                        }
                    };
                });
            }
        }

        const parrafosNormalizados = [];

        // 3. ITERAR Y FILTRAR
        nodosExtraidos.forEach((nodo, index) => {
            procesarNodo(nodo);
            
            // Descartar basura: nodos completamente vacíos
            if (nodo.texto === '[VACÍO]' && (!nodo.fragmentos || nodo.fragmentos.length === 0)) {
                return; 
            }

            nodo.id = nodo.id || `p-${index + 1}`;
            parrafosNormalizados.push(nodo);
        });

        console.log(`🔍 [AST Adapter Universal]: Se extrajeron y normalizaron exitosamente ${parrafosNormalizados.length} párrafos.`);

        return {
            metadatos: metadatos,
            parrafos: parrafosNormalizados
        };
    }
}

module.exports = IndesignAstAdapter;