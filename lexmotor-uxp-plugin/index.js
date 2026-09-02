(function() {
    var logDiv = null;
    function log(m) {
        console.log(m);
        if (logDiv) {
            logDiv.innerHTML += m + "<br>";
            logDiv.scrollTop = logDiv.scrollHeight;
        }
    }
    
    function getDocName() {
        try {
            var indesign = require("indesign");
            var app = indesign.app;
            if (app.documents.length === 0) return null;
            var doc = app.activeDocument;
            var name = doc.name;
            if (name.indexOf('.indd') !== -1) {
                name = name.substring(0, name.indexOf('.indd'));
            }
            return name;
        } catch(e) { return null; }
    }
    
    function actualizarProgreso(porcentaje, mensaje) {
        var container = document.getElementById("progressContainer");
        var bar = document.getElementById("progressBar");
        var text = document.getElementById("progressText");
        
        if (container && bar && text) {
            container.style.display = "block";
            var pctRedondeado = Math.round(porcentaje);
            bar.style.width = pctRedondeado + "%";
            text.textContent = pctRedondeado + "% - " + mensaje;
        }
    }

    function init() {
        logDiv = document.getElementById("log");
        log("PLUGIN v1.0 - LISTO");
        
        var docStatus = document.getElementById("docStatus");
        var docName = getDocName();
        if (docName && docStatus) {
            docStatus.textContent = docName;
            log("Doc activo detectado: " + docName);
        } else if (docStatus) {
            docStatus.textContent = "⚠️ Ningún documento abierto";
        }
        
        var btn = document.getElementById("btnProbar") || document.getElementById("btnCompilar");
        if (btn) {
            btn.onclick = async function() {
                var nombreDoc = getDocName();
                if (!nombreDoc) {
                    log("❌ Error: No hay documento .indd abierto en InDesign.");
                    return;
                }
                
                log("🚀 Iniciando proceso de compilación industrial...");
                actualizarProgreso(15, "Conectando con servidor local...");

                try {
                    actualizarProgreso(50, "Ejecutando orquestador Node.js...");
                    
                    var response = await fetch("http://localhost:3000/api/compilar", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ documento: nombreDoc })
                    });

                    var data = await response.json();

                    if (data.success) {
                        actualizarProgreso(100, "¡Completado con éxito!");
                        log("✅ " + data.message);
                        if (data.output) {
                            log("<pre style='color:#4caf50; margin:4px 0;'>" + data.output.replace(/\n/g, "<br>") + "</pre>");
                        }
                        btn.textContent = "¡Compilado OK!";
                        btn.style.backgroundColor = "#2e7d32";
                    } else {
                        actualizarProgreso(100, "Error en compilación");
                        log("❌ Error en servidor: " + (data.error || "Desconocido"));
                        if (data.details) {
                            log("<pre style='color:#f44336; margin:4px 0;'>" + data.details.replace(/\n/g, "<br>") + "</pre>");
                        }
                    }
                } catch (err) {
                    actualizarProgreso(100, "Error de red");
                    log("❌ Error de red: No se pudo contactar al servidor en el puerto 3000.<br>Verifica que 'node servidor.js' esté activo en tu terminal.");
                }
            };
            log("✅ Botón de compilación vinculado.");
        }
    }
    
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else { init(); }
})();