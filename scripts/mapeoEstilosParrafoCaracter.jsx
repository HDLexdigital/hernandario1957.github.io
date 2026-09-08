/**
 * Script de InDesign ExtendScript (ES3) para generar automáticamente
 * los objetos JSON de mapeo de párrafos y caracteres de la publicación activa.
 */
(function() {
    try {
        if (app.documents.length === 0) {
            alert("⚠️ No hay ningún documento abierto en InDesign.");
            return;
        }

        var doc = app.activeDocument;
        
        // 1. Recopilar estilos de párrafo
        var estilosParrafoObj = {};
        var pStyles = doc.allParagraphStyles;
        
        for (var i = 0; i < pStyles.length; i++) {
            var st = pStyles[i];
            var nombreOriginal = st.name;
            
            // Omitir estilos por defecto del sistema si se desea, o mapearlos todos
            if (nombreOriginal === "[No Paragraph Style]" || nombreOriginal === "[Basic Paragraph]") {
                continue;
            }

            // Clave limpia para el JSON (p.ej. mayúsculas y guiones bajos)
            var claveEstilo = nombreOriginal.toUpperCase().replace(/[\s\-]+/g, "_");

            // Intentar leer las configuraciones de Export Tagging si existen
            var tagEpub = "p";
            var claseCss = nombreOriginal.toLowerCase().replace(/[\s\_]+/g, "-");

            try {
                if (st.exportTagging && st.exportTagging.epub) {
                    if (st.exportTagging.epub.tag) {
                        tagEpub = st.exportTagging.epub.tag.toLowerCase();
                    }
                    if (st.exportTagging.epub.className) {
                        claseCss = st.exportTagging.epub.className;
                    }
                }
            } catch(e) {}

            estilosParrafoObj[claveEstilo] = {
                "etiqueta": tagEpub,
                "clase": claseCss
            };
        }

        // 2. Recopilar estilos de carácter
        var estilosCaracterObj = {};
        var cStyles = doc.allCharacterStyles;
        
        for (var j = 0; j < cStyles.length; j++) {
            var cSt = cStyles[j];
            var cNombreOriginal = cSt.name;

            if (cNombreOriginal === "[None]" || cNombreOriginal === "[No Character Style]") {
                continue;
            }

            var cClaveEstilo = cNombreOriginal.toLowerCase().replace(/[\s\-]+/g, "-");
            var cClaseCss = cNombreOriginal.toLowerCase().replace(/[\s\_]+/g, "-");

            estilosCaracterObj[cClaveEstilo] = {
                "etiqueta": "span",
                "clase": cClaseCss
            };
        }

        // 3. Construir la estructura completa del mapa editorial
        var mapaEditorial = {
            "perfil": "constitucion_y_codigos",
            "mapeoEstilosParrafo": estilosParrafoObj,
            "mapeoEstilosCaracter": estilosCaracterObj
        };

        var jsonString = JSON.stringify(mapaEditorial, null, 4);

        // 4. Guardar archivo en el disco mediante el diálogo del sistema
        var archivoDestino = File.saveDialog("Guardar mapa_estilos.json", "*.json");
        
        if (archivoDestino) {
            archivoDestino.encoding = "UTF-8";
            archivoDestino.open("w");
            archivoDestino.write(jsonString);
            archivoDestino.close();
            alert("✅ ¡Mapeo de estilos generado con éxito en:\n" + archivoDestino.fsName);
        }

    } catch (error) {
        alert("❌ Error al generar el mapa de estilos: " + error.message);
    }
})();