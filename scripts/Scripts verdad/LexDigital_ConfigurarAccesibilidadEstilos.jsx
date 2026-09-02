#target indesign

function configurarAccesibilidadEstilosEditorial() {
    if (app.documents.length === 0) {
        alert("Por favor, abre un documento en InDesign antes de ejecutar el script.");
        return;
    }

    var doc = app.activeDocument;

    // Configuración completa de estilos con sus etiquetas semánticas, clases, roles ARIA y PDF tags
    var reglas = [
        // ==========================================
        // 1. CUERPO DE TEXTO Y PÁRRAFOS (P01)
        // ==========================================
        { tipo: "parrafo", nombre: "P01_BODY_BASE", html: "p", clase: "p01-body-base", aria: 'role="paragraph"', pdf: "P" },
        { tipo: "parrafo", nombre: "P01_BODY_CONT", html: "p", clase: "p01-body-cont", aria: 'role="paragraph"', pdf: "P" },
        { tipo: "parrafo", nombre: "P01_BODY_FIRST", html: "p", clase: "p01-body-first", aria: 'role="paragraph"', pdf: "P" },
        { tipo: "parrafo", nombre: "P01_BODY_NO_SENTENCE", html: "p", clase: "p01-body-no-sentence", aria: 'role="paragraph"', pdf: "P" },

        // ==========================================
        // 2. TÍTULOS Y JERARQUÍA EDITORIAL (P02)
        // ==========================================
        { tipo: "parrafo", nombre: "P02_TITLE_BASE", html: "h1", clase: "p02-title-base", aria: 'role="heading" aria-level="1"', pdf: "H1" },
        { tipo: "parrafo", nombre: "P02_TITLE_BOOK", html: "h1", clase: "p02-title-book", aria: 'role="heading" aria-level="1"', pdf: "H1" },
        { tipo: "parrafo", nombre: "P02_TITLE_BOOK_SUB", html: "p", clase: "p02-title-book-sub", aria: 'role="doc-subtitle"', pdf: "H2" },
        { tipo: "parrafo", nombre: "P02_TITLE_CHAPTER", html: "h2", clase: "p02-title-chapter", aria: 'role="heading" aria-level="2"', pdf: "H2" },
        { tipo: "parrafo", nombre: "P02_TITLE_MAIN", html: "h1", clase: "p02-title-main", aria: 'role="heading" aria-level="1"', pdf: "H1" },
        { tipo: "parrafo", nombre: "P02_TITLE_PART", html: "h1", clase: "p02-title-part", aria: 'role="heading" aria-level="1"', pdf: "H1" },

        // ==========================================
        // 3. CRÉDITOS, FIRMAS Y ELEMENTOS CENTRADOS (P03)
        // ==========================================
        { tipo: "parrafo", nombre: "P03_CENTER_BOLD", html: "p", clase: "p03-center-bold", aria: 'role="paragraph"', pdf: "P" },
        { tipo: "parrafo", nombre: "P03_CENTER_NORMAL", html: "p", clase: "p03-center-normal", aria: 'role="paragraph"', pdf: "P" },
        { tipo: "parrafo", nombre: "P03_OFFICIAL_NAME", html: "p", clase: "p03-official-name", aria: 'role="doc-credit"', pdf: "P" },
        { tipo: "parrafo", nombre: "P03_OFFICIAL_ROLE", html: "p", clase: "p03-official-role", aria: 'role="doc-credit"', pdf: "P" },

        // ==========================================
        // 4. ÍNDICES Y NAVEGACIÓN (P05)
        // ==========================================
        { tipo: "parrafo", nombre: "P05_IDX_ART", html: "nav", clase: "p05-idx-art", aria: 'role="doc-index" aria-label="Índice analítico de artículos"', pdf: "TOC" },

        // ==========================================
        // 5. INCISOS, NUMERALES Y SANGRÍAS (P07)
        // ==========================================
        { tipo: "parrafo", nombre: "P07_INDENT_L1", html: "p", clase: "p07-indent-l1", aria: 'role="listitem"', pdf: "P" },
        { tipo: "parrafo", nombre: "P07_INDENT_L1_NONUM", html: "p", clase: "p07-indent-l1-nonum", aria: 'role="paragraph"', pdf: "P" },
        { tipo: "parrafo", nombre: "P07_INDENT_L2", html: "p", clase: "p07-indent-l2", aria: 'role="listitem"', pdf: "P" },

        // ==========================================
        // 6. GLOSARIO Y TÉRMINOS (P08)
        // ==========================================
        { tipo: "parrafo", nombre: "P08_GLS-ART", html: "section", clase: "p08-gls-art", aria: 'role="doc-glossary" aria-label="Glosario"', pdf: "P" },
        { tipo: "parrafo", nombre: "P08_GLS_TERM_DD", html: "dd", clase: "p08-gls-term-dd", aria: 'role="definition"', pdf: "P" },
        { tipo: "parrafo", nombre: "P08_GLS_TERM_DT", html: "dt", clase: "p08-gls-term-dt", aria: 'role="term"', pdf: "P" },

        // ==========================================
        // 7. SECCIONES PRELIMINARES Y ESTRUCTURA LEGAL
        // ==========================================
        { tipo: "parrafo", nombre: "portadilla", html: "header", clase: "portadilla", aria: 'role="doc-cover"', pdf: "P" },
        { tipo: "parrafo", nombre: "pagina-legal", html: "section", clase: "pagina-legal", aria: 'role="doc-colophon" aria-label="Página legal y créditos"', pdf: "P" },
        { tipo: "parrafo", nombre: "introduccion", html: "section", clase: "introduccion", aria: 'role="doc-introduction" aria-label="Introducción"', pdf: "P" },
        { tipo: "parrafo", nombre: "tabla-contenidos", html: "nav", clase: "tabla-contenidos", aria: 'role="doc-toc" aria-label="Tabla de contenidos"', pdf: "TOC" },
        { tipo: "parrafo", nombre: "titulo-obra", html: "h1", clase: "titulo-obra", aria: 'role="heading" aria-level="1"', pdf: "H1" },
        { tipo: "parrafo", nombre: "titulo-nivel2", html: "h2", clase: "titulo-nivel2", aria: 'role="heading" aria-level="2"', pdf: "H2" },
        { tipo: "parrafo", nombre: "titulo-nivel3", html: "h3", clase: "titulo-nivel3", aria: 'role="heading" aria-level="3"', pdf: "H3" },
        { tipo: "parrafo", nombre: "titulo-nivel4", html: "h4", clase: "titulo-nivel4", aria: 'role="heading" aria-level="4"', pdf: "H4" },
        { tipo: "parrafo", nombre: "articulo", html: "article", clase: "articulo", aria: 'role="article"', pdf: "P" },
        { tipo: "parrafo", nombre: "inciso", html: "p", clase: "inciso", aria: 'role="paragraph"', pdf: "P" },
        { tipo: "parrafo", nombre: "paragrafo", html: "aside", clase: "paragrafo", aria: 'role="doc-notice" aria-label="Parágrafo"', pdf: "P" },
        { tipo: "parrafo", nombre: "glosario", html: "section", clase: "glosario", aria: 'role="doc-glossary" aria-label="Glosario"', pdf: "P" },
        { tipo: "parrafo", nombre: "termino", html: "dt", clase: "termino", aria: 'role="term"', pdf: "P" },
        { tipo: "parrafo", nombre: "definicion", html: "dd", clase: "definicion", aria: 'role="definition"', pdf: "P" },

        // ==========================================
        // 8. ESTILOS DE CARÁCTER (Elementos inline)
        // ==========================================
        { tipo: "caracter", nombre: "C01_ENFASIS", html: "em", clase: "c01-enfasis", aria: 'epub:type="seml:emphasis"', pdf: "Span" },
        { tipo: "caracter", nombre: "C02_LEGAL_REF", html: "cite", clase: "c02-legal-ref", aria: 'epub:type="biblioentry" role="doc-biblioref"', pdf: "Span" },
        { tipo: "caracter", nombre: "C03_BOLD", html: "strong", clase: "c03-bold", aria: "", pdf: "Span" }
    ];

    var actualizados = 0;
    var omitidos = 0;
    var listaOmitidos = [];

    for (var i = 0; i < reglas.length; i++) {
        var r = reglas[i];
        var tipoEstilo = r.tipo || "parrafo";
        var estilo = (tipoEstilo === "caracter") 
            ? doc.characterStyles.itemByName(r.nombre) 
            : doc.paragraphStyles.itemByName(r.nombre);

        // Si el estilo no existe en el documento, se omite de forma segura en lugar de crear un huérfano sin diseño
        if (!estilo.isValid) {
            omitidos++;
            listaOmitidos.push(r.nombre);
            continue;
        }

        // Limpiar reglas anteriores para evitar duplicaciones
        while (estilo.styleExportTagMaps.length > 0) {
            estilo.styleExportTagMaps[0].remove();
        }

        // 1. Asignar regla para EPUB / HTML con roles ARIA y Digital Publishing (DPUB)
        try {
            estilo.styleExportTagMaps.add({
                exportType: "EPUB",
                exportTag: r.html,
                exportClass: r.clase,
                exportAttributes: r.aria
            });
        } catch(e) {}

        // 2. Asignar regla para PDF Accesible (PDF/UA)
        try {
            estilo.styleExportTagMaps.add({
                exportType: "PDF",
                exportTag: r.pdf,
                exportClass: "",
                exportAttributes: ""
            });
        } catch(e) {}

        actualizados++;
    }

    var mensajeReporte = 
        "Configuración de accesibilidad completada:\n\n" +
        "• Estilos configurados/actualizados: " + actualizados + "\n" +
        "• Estilos omitidos (no existen en el documento): " + omitidos;

    if (listaOmitidos.length > 0) {
        mensajeReporte += "\n\n⚠️ Omitidos: " + listaOmitidos.join(", ");
    }

    alert(mensajeReporte);
}

configurarAccesibilidadEstilosEditorial();