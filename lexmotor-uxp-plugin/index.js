(function() {
    var CONFIG = {
        PRIMARY_URL: "http://127.0.0.1:8765/api/ingest",
        FALLBACK_URL: "http://127.0.0.1:3000/api/ingest",
        PLUGIN_VERSION: "1.2.0"
    };

    var logDiv = null;
    
    function log(m) {
        console.log(m);
        if (logDiv) {
            logDiv.innerHTML += m + "<br>";
            logDiv.scrollTop = logDiv.scrollHeight;
        }
    }

    function getIndesignApp() {
        try {
            return require("indesign").app;
        } catch(e) { 
            throw new Error("[UXP] No se pudo vincular con el host de InDesign."); 
        }
    }

    function actualizarProgreso(porcentaje, mensaje) {
        var container = document.getElementById("progressContainer");
        var bar = document.getElementById("progressBar");
        var text = document.getElementById("progressText");
        
        if (container && bar && text) {
            container.style.display = "block";
            bar.style.width = Math.round(porcentaje) + "%";
            text.textContent = Math.round(porcentaje) + "% - " + mensaje;
        }
    }

    async function init() {
        logDiv = document.getElementById("log");
        log("LexDigitalHD Plugin v" + CONFIG.PLUGIN_VERSION + " - LISTO");
        
        var app;
        try {
            app = getIndesignApp();
        } catch (initError) {
            log("❌ " + initError.message);
            return;
        }

        var docStatus = document.getElementById("docStatus");
        
        if (app.documents && app.documents.length > 0) {
            docStatus.textContent = app.activeDocument.name;
            log("Doc activo detectado: " + app.activeDocument.name);
        } else if (docStatus) {
            docStatus.textContent = "⚠️ Ningún documento abierto";
        }
        
        var btn = document.getElementById("btnProbar") || document.getElementById("btnCompilar");
        if (btn) {
            btn.onclick = async function() {
                if (!app.documents || app.documents.length === 0) {
                    log("❌ Error: No hay documento activo.");
                    return;
                }
                
                try {
                    log("🚀 Iniciando extracción de evidencia...");
                    actualizarProgreso(20, "Construyendo contrato de datos...");
                    
                    var doc = app.activeDocument;
                    
                    // Resolución robusta del extractor estructural
                    var extractor = (typeof window !== 'undefined' && window.extraerDocumentoEstructurado) ||
                                    (typeof extraerDocumentoEstructurado === 'function' ? extraerDocumentoEstructurado : null);
                    if (!extractor) {
                        try {
                            extractor = require('./src/extraction/StructuredDocumentExtractor').extraerDocumentoEstructurado;
                        } catch (_) {}
                    }
                    if (typeof extractor !== 'function') {
                        throw new Error("Extractor estructural no encontrado en el contexto global ni modular.");
                    }
                    
                    var payload = extractor(doc);
                    log("✅ Contrato estructurado. Nodos extraídos: " + payload.document.nodes.length);
                    actualizarProgreso(50, "Transfiriendo evidencia al Pipeline...");
                    
                    var response = null;
                    var urlUsada = CONFIG.PRIMARY_URL;
                    try {
                        response = await fetch(CONFIG.PRIMARY_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                        });
                    } catch (netErr) {
                        log("⚠️ Pipeline primario (8765) no accesible directamente, intentando canal alternativo...");
                        urlUsada = CONFIG.FALLBACK_URL;
                        response = await fetch(CONFIG.FALLBACK_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                        });
                    }

                    if (response && response.ok) {
                        var responseData = await response.json();
                        actualizarProgreso(100, "Evidencia aceptada.");
                        log("✅ Certificación Pipeline: " + (responseData.message || "Procesado con éxito"));
                        if (responseData.evidenceId) log("🔗 Evidence Hash: " + responseData.evidenceId);
                        if (responseData.archivoSalida) log("📄 Archivo generado: " + responseData.archivoSalida);
                        btn.style.backgroundColor = "#2e7d32";
                    } else {
                        var errorData = response ? await response.json().catch(function() { return {}; }) : {};
                        throw new Error("El receptor rechazó el contrato (" + urlUsada + "). Estado: " + (response ? response.status : "Sin respuesta") + " " + (errorData.error || ""));
                    }

                } catch (err) {
                    actualizarProgreso(100, "Pipeline abortado");
                    log("❌ ERROR CRÍTICO: " + err.message);
                    console.error("[LexDigitalHD Exception]", err);
                }
            };
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else { init(); }
})();
