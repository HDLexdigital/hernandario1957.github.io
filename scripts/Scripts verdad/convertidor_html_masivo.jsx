#target indesign

// ==============================================================================
// LexCodex - convertidor_html_masivo.jsx (v2.3)
// Herramienta unificada para Reportes de Estilos y Extracción Masiva de HTML
// ==============================================================================

// ----------------------------------------------------------------
//  UTILIDADES SEGURAS PARA EL MOTOR ES3
// ----------------------------------------------------------------
function obtenerPropiedadSegura(obj, prop, defaultValue) {
    if (!obj) return defaultValue;
    try {
        var val = obj[prop];
        return (val !== undefined && val !== null) ? val : defaultValue;
    } catch(e) {
        return defaultValue;
    }
}

function obtenerNombreFuente(estilo) {
    try {
        if (estilo.appliedFont) {
            if (typeof estilo.appliedFont === "object" && estilo.appliedFont.name) {
                return estilo.appliedFont.name;
            } else {
                return String(estilo.appliedFont);
            }
        }
    } catch(e) {}
    return "[Indefinida]";
}

function obtenerAlineacion(estilo) {
    try {
        var just = estilo.justification;
        if (just !== undefined && just !== null) {
            var strJust = String(just);
            var partes = strJust.split('_');
            return partes[partes.length - 1] || strJust;
        }
    } catch(e) {}
    return "No definida";
}

function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/\n/g, "")  
        .replace(/\u2028/g, "");  
}

function sanitizarClaseCss(nombre) {
    if (!nombre) return "";
    return String(nombre)
        .toLowerCase()
        .replace(/^\s+|\s+$/g, "")
        .replace(/[^\w-]/g, "-")
        .replace(/--+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function mapearEtiquetaSemantica(nombreEstilo) {
    var nombre = nombreEstilo.toLowerCase();
    if (nombre.indexOf("título") !== -1 || nombre.indexOf("heading") !== -1 || nombre.indexOf("titulo") !== -1) {
        var match = nombre.match(/\d+/);
        var nivel = match ? match[0] : "1";
        return "h" + nivel;
    }
    if (nombre.indexOf("cita") !== -1 || nombre.indexOf("blockquote") !== -1) return "blockquote";
    if (nombre.indexOf("código") !== -1 || nombre.indexOf("code") !== -1) return "pre";
    return "p";
}

// ----------------------------------------------------------------
//  PORTAPAPELES (Técnica segura de marco de texto temporal)
// ----------------------------------------------------------------
function copiarTextoAlPortapapeles(texto) {
    if (!texto) return;
    var doc = app.activeDocument;
    if (!doc) return;

    var seleccionOriginal = app.selection;

    try {
        var pagina = doc.pages[0];
        var marco = pagina.textFrames.add();
        var anchoPagina = pagina.bounds[3] - pagina.bounds[1];
        var altoPagina = pagina.bounds[2] - pagina.bounds[0];
        
        marco.geometricBounds = [
            altoPagina - 20,
            anchoPagina - 20,
            altoPagina - 5,
            altoPagina - 5
        ];
        
        marco.contents = texto;
        marco.texts[0].select();
        app.copy();
        marco.remove();

        if (seleccionOriginal && seleccionOriginal.length > 0) {
            seleccionOriginal[0].select();
        }
    } catch(e) {
        alert("Error al copiar al portapapeles:\n" + e.message);
        if (seleccionOriginal && seleccionOriginal.length > 0) {
            try { seleccionOriginal[0].select(); } catch(err) {}
        }
    }
}

// ----------------------------------------------------------------
//  VENTANA MODAL MULTILÍNEA PARA RESULTADOS
// ----------------------------------------------------------------
function mostrarVentanaModalMasivo(htmlTexto, totalParr, nombreEstilo) {
    var ventana = new Window("dialog", "Extracción HTML Masiva - " + nombreEstilo);
    ventana.orientation = "column";
    ventana.alignChildren = ["fill", "fill"];
    ventana.preferredSize = [700, 480]; 

    ventana.add("statictext", undefined, "✅ Se procesaron e independizaron " + totalParr + " párrafos con el estilo '" + nombreEstilo + "'.");
    ventana.add("statictext", undefined, "El código HTML generado está disponible y copiado en el portapapeles:");
    
    var cuadroTexto = ventana.add("edittext", undefined, htmlTexto, {multiline: true, scrolling: true});
    cuadroTexto.preferredSize = [670, 340];

    var grupoBotones = ventana.add("group");
    grupoBotones.alignment = "center";
    
    var btnCerrar = grupoBotones.add("button", undefined, "Cerrar", {name: "ok"});
    btnCerrar.onClick = function() { ventana.close(); };

    ventana.show();
}

// ==============================================================================
//  PANEL PRINCIPAL INTERACTIVO
// ==============================================================================
function lanzarPanelHerramientas() {
    if (app.documents.length === 0) {
        alert("Por favor, abre un documento de InDesign antes de ejecutar el script.");
        return;
    }

    var doc = app.activeDocument;

    var dlg = new Window("dialog", "LexCodex - convertidor_html_masivo");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 15;
    dlg.margins = 16;

    // --- PANEL 1: Reporte de Estilos ---
    var pnlReporte = dlg.add("panel", undefined, "1. Reporte de Características de Estilos");
    pnlReporte.orientation = "column";
    pnlReporte.alignChildren = ["fill", "top"];
    pnlReporte.margins = 15;
    pnlReporte.spacing = 10;

    pnlReporte.add("statictext", undefined, "Selecciona el tipo de estilo a analizar:");
    var grupoTipo = pnlReporte.add("group");
    grupoTipo.orientation = "row";
    grupoTipo.alignChildren = "left";
    var rbParrafo = grupoTipo.add("radiobutton", undefined, "Párrafo");
    var rbCaracter = grupoTipo.add("radiobutton", undefined, "Carácter");
    rbParrafo.value = true;

    pnlReporte.add("statictext", undefined, "Selecciona un estilo específico o 'Todos':");
    var dropdown = pnlReporte.add("dropdownlist", undefined, ["[Cargando...]"]);
    dropdown.selection = 0;

    function actualizarListaEstilos() {
        var lista = [];
        if (rbParrafo.value) {
            var estilos = doc.allParagraphStyles;
            lista.push("[ TODOS LOS ESTILOS DE PÁRRAFO ]");
            for (var i = 0; i < estilos.length; i++) {
                var nombre = estilos[i].name;
                if (nombre.indexOf("[Ningún") === -1 && nombre.indexOf("No Paragraph Style") === -1) {
                    lista.push(nombre);
                }
            }
        } else {
            var estilos = doc.allCharacterStyles;
            lista.push("[ TODOS LOS ESTILOS DE CARÁCTER ]");
            for (var j = 0; j < estilos.length; j++) {
                var nombreC = estilos[j].name;
                if (nombreC.indexOf("[Ningún") === -1 && nombreC.indexOf("No Character Style") === -1) {
                    lista.push(nombreC);
                }
            }
        }
        dropdown.removeAll();
        for (var k = 0; k < lista.length; k++) {
            dropdown.add("item", lista[k]);
        }
        dropdown.selection = 0;
    }

    rbParrafo.onClick = actualizarListaEstilos;
    rbCaracter.onClick = actualizarListaEstilos;
    actualizarListaEstilos();

    var btnReporte = pnlReporte.add("button", undefined, "Generar Reporte TXT");

    // --- PANEL 2: Extracción HTML Masiva ---
    var pnlHtml = dlg.add("panel", undefined, "2. Extractor HTML Masivo por Estilo de Párrafo");
    pnlHtml.orientation = "column";
    pnlHtml.alignChildren = ["fill", "top"];
    pnlHtml.margins = 15;
    pnlHtml.spacing = 10;
    
    pnlHtml.add("statictext", undefined, "Selecciona el Estilo de Párrafo para procesar todos sus elementos en lote:", {multiline: true});
    
    var dropdownHtml = pnlHtml.add("dropdownlist", undefined, ["[Cargando...]"]);
    
    function actualizarDropdownHtml() {
        var listaP = doc.allParagraphStyles;
        dropdownHtml.removeAll();
        for (var i = 0; i < listaP.length; i++) {
            var nombreP = listaP[i].name;
            if (nombreP.indexOf("[Ningún") === -1 && nombreP.indexOf("No Paragraph Style") === -1) {
                dropdownHtml.add("item", nombreP);
            }
        }
        if (dropdownHtml.items.length > 0) {
            dropdownHtml.selection = 0;
        }
    }
    actualizarDropdownHtml();

    var btnHtml = pnlHtml.add("button", undefined, "Procesar y Extraer Todos los Párrafos de este Estilo");

    var btnGroup = dlg.add("group");
    btnGroup.alignment = "right";
    var btnCancel = btnGroup.add("button", undefined, "Cerrar", { name: "cancel" });

    var accion = 0;
    var tipoEstilo = "parrafo";

    btnReporte.onClick = function() {
        accion = 1;
        tipoEstilo = rbParrafo.value ? "parrafo" : "caracter";
        dlg.close();
    };

    btnHtml.onClick = function() {
        accion = 2;
        dlg.close();
    };

    dlg.show();

    if (accion === 1) {
        ejecutarReporteLogic(doc, tipoEstilo, dropdown.selection.index);
    } else if (accion === 2) {
        var estiloSeleccionadoNombre = dropdownHtml.selection ? dropdownHtml.selection.text : null;
        if (estiloSeleccionadoNombre) {
            ejecutarExtraerHtmlMasivoLogic(doc, estiloSeleccionadoNombre);
        } else {
            alert("Por favor, selecciona un estilo de párrafo válido.");
        }
    }
}

// ==============================================================================
//  LÓGICA 1: REPORTE DE ESTILOS
// ==============================================================================
function ejecutarReporteLogic(doc, tipo, selectedIndex) {
    var listaEstilos = (tipo === "parrafo") ? doc.allParagraphStyles : doc.allCharacterStyles;
    var estilosAProcesar = [];

    if (selectedIndex === 0) {
        estilosAProcesar = listaEstilos;
    } else {
        var idx = selectedIndex - 1;
        if (idx >= 0 && idx < listaEstilos.length) {
            estilosAProcesar.push(listaEstilos[idx]);
        } else {
            alert("Error al seleccionar el estilo.");
            return;
        }
    }

    var fecha = new Date();
    var reporte = "=================================================================\n";
    reporte += " REPORTE DE CARACTERÍSTICAS DE ESTILOS (" + (tipo === "parrafo" ? "PÁRRAFO" : "CARÁCTER") + ")\n";
    reporte += " Documento : " + doc.name + "\n";
    reporte += " Fecha     : " + fecha.toLocaleString() + "\n";
    reporte += "=================================================================\n\n";

    for (var j = 0; j < estilosAProcesar.length; j++) {
        var st = estilosAProcesar[j];
        var nombreEstilo = st.name;
        if (nombreEstilo.indexOf("[Ningún") !== -1 || nombreEstilo.indexOf("No ") !== -1) continue;

        reporte += "-----------------------------------------------------------------\n";
        reporte += " ESTILO: " + nombreEstilo + "\n";
        reporte += "-----------------------------------------------------------------\n";

        var fuente = obtenerNombreFuente(st);
        var fontStyle = obtenerPropiedadSegura(st, "fontStyle", "Regular");
        reporte += "  • Fuente             : " + fuente + " (" + fontStyle + ")\n";
        
        var pointSize = obtenerPropiedadSegura(st, "pointSize", 0);
        reporte += "  • Tamaño (Cuerpo)    : " + pointSize + " pt\n";

        var leading = obtenerPropiedadSegura(st, "leading", "Automático");
        if (leading === "Automático" || leading === Leading.AUTO) {
            reporte += "  • Interlineado       : Automático\n";
        } else {
            reporte += "  • Interlineado       : " + leading + " pt\n";
        }

        var tracking = obtenerPropiedadSegura(st, "tracking", 0);
        var kerning = obtenerPropiedadSegura(st, "kerningMethod", 0);
        reporte += "  • Tracking / Kerning   : " + tracking + " / " + kerning + "\n";

        try {
            var color = st.fillColor ? st.fillColor.name : "[Sin color]";
            var tint = st.fillTint !== undefined ? st.fillTint : 100;
            reporte += "  • Color de relleno   : " + color + " (" + tint + "%)\n";
        } catch(e) {
            reporte += "  • Color de relleno   : [No disponible]\n";
        }

        if (tipo === "parrafo") {
            var basedOn = obtenerPropiedadSegura(st, "basedOn", null);
            reporte += "  • Basado en          : " + (basedOn ? basedOn.name : "[Ninguno]") + "\n";
            var nextStyle = obtenerPropiedadSegura(st, "nextStyle", null);
            reporte += "  • Siguiente estilo   : " + (nextStyle ? nextStyle.name : "[Mismo estilo]") + "\n";
            reporte += "  • Alineación         : " + obtenerAlineacion(st) + "\n";
            reporte += "  • Espacio antes      : " + obtenerPropiedadSegura(st, "spaceBefore", 0) + " pt\n";
            reporte += "  • Espacio después    : " + obtenerPropiedadSegura(st, "spaceAfter", 0) + " pt\n";
            reporte += "  • Sangría izquierda  : " + obtenerPropiedadSegura(st, "leftIndent", 0) + " pt\n";
            reporte += "  • Sangría derecha    : " + obtenerPropiedadSegura(st, "rightIndent", 0) + " pt\n";
            reporte += "  • Sangría 1ª línea   : " + obtenerPropiedadSegura(st, "firstLineIndent", 0) + " pt\n";
            reporte += "  • Separación sílabas : " + (obtenerPropiedadSegura(st, "hyphenation", false) ? "Activada" : "Desactivada") + "\n";
        }
        reporte += "\n";
    }

    var nombreLimpioDoc = doc.name.replace(/\.[^\.]+$/, "");
    var sufijo = (tipo === "parrafo") ? "P" : "C";
    var archivoReporte = new File(Folder.desktop + "/Reporte_Estilos_" + sufijo + "_" + nombreLimpioDoc + ".txt");

    archivoReporte.encoding = "UTF-8";
    if (archivoReporte.open("w")) {
        archivoReporte.write(reporte);
        archivoReporte.close();

        var abrir = confirm(
            "Reporte generado con éxito en el Escritorio:\n" +
            archivoReporte.fsName + "\n\n¿Deseas abrir el archivo ahora?"
        );
        if (abrir) {
            archivoReporte.execute();
        }
    } else {
        alert("No se pudo escribir el archivo en el escritorio.");
    }
}

// ==============================================================================
//  LÓGICA 2: EXTRACCIÓN HTML MASIVA DE PÁRRAFOS SEGÚN ESTILO
// ==============================================================================
function ejecutarExtraerHtmlMasivoLogic(doc, nombreEstiloParrafo) {
    app.findTextPreferences = NothingEnum.NOTHING;
    app.changeTextPreferences = NothingEnum.NOTHING;
    
    try {
        app.findTextPreferences.appliedParagraphStyle = doc.paragraphStyles.itemByName(nombreEstiloParrafo);
    } catch(e) {
        alert("No se pudo encontrar el estilo de párrafo: " + nombreEstiloParrafo);
        return;
    }

    var resultadosBusqueda = doc.findText();
    app.findTextPreferences = NothingEnum.NOTHING;

    if (resultadosBusqueda.length === 0) {
        alert("No se encontraron párrafos con el estilo asignado: '" + nombreEstiloParrafo + "' en este documento.");
        return;
    }

    var htmlMasivoArr = [];

    for (var i = 0; i < resultadosBusqueda.length; i++) {
        var parrafo = resultadosBusqueda[i];
        
        var pEstiloNombre = String(parrafo.appliedParagraphStyle.name);
        var pEtiqueta = mapearEtiquetaSemantica(pEstiloNombre);
        var pClaseBase = sanitizarClaseCss(pEstiloNombre);
        
        var claseAlineacion = "";
        try {
            var justificacion = String(parrafo.justification);
            if (justificacion.indexOf("JUSTIFIED") !== -1) {
                claseAlineacion = " parrafo-justificado";
            }
        } catch(e) {}

        var clasesCombinadas = "";
        if (pClaseBase && pClaseBase !== "parrafo-basico" && pClaseBase !== "ninguno") {
            clasesCombinadas = pClaseBase;
        }
        clasesCombinadas += claseAlineacion;
        clasesCombinadas = clasesCombinadas.replace(/^\s+|\s+$/g, "");

        var htmlParrafo = "<" + pEtiqueta;
        if (clasesCombinadas !== "") {
            htmlParrafo += ' class="' + clasesCombinadas + '"';
        }
        htmlParrafo += ">";

        var rangos = parrafo.textStyleRanges;
        for (var j = 0; j < rangos.length; j++) {
            var rango = rangos[j];
            var contenido = escaparHtml(rango.contents);
            if (contenido === "") continue;

            var openTags = "";
            var closeTags = "";

            var nombreEstiloChar = "";
            try {
                if (rango.appliedCharacterStyle && rango.appliedCharacterStyle.name) {
                    nombreEstiloChar = String(rango.appliedCharacterStyle.name);
                }
            } catch(e) {}

            var claseCharLimpia = sanitizarClaseCss(nombreEstiloChar);
            var tieneEstiloAsignado = (claseCharLimpia !== "" && claseCharLimpia !== "ninguno" && claseCharLimpia !== "no-character-style" && claseCharLimpia !== "none" && claseCharLimpia !== "[none]");

            if (tieneEstiloAsignado) {
                openTags += '<span class="' + claseCharLimpia + '">';
                closeTags = "</span>" + closeTags;
            }

            var fontStyle = "";
            try { 
                fontStyle = String(rango.fontStyle).toLowerCase(); 
            } catch(e) {}

            var esBold = (fontStyle.indexOf("bold") !== -1);
            var esItalic = (fontStyle.indexOf("italic") !== -1);

            if (esBold) { 
                openTags += "<strong>"; 
                closeTags = "</strong>" + closeTags; 
            }
            if (esItalic) { 
                openTags += "<em>"; 
                closeTags = "</em>" + closeTags; 
            }

            htmlParrafo += openTags + contenido + closeTags;
        }

        htmlParrafo += "</" + pEtiqueta + ">";
        htmlMasivoArr.push(htmlParrafo);
    }

    var textoHtmlFinal = htmlMasivoArr.join("\n");

    copiarTextoAlPortapapeles(textoHtmlFinal);
    mostrarVentanaModalMasivo(textoHtmlFinal, resultadosBusqueda.length, nombreEstiloParrafo);
}

// ----------------------------------------------------------------
//  INICIAR APLICACIÓN
// ----------------------------------------------------------------
lanzarPanelHerramientas();