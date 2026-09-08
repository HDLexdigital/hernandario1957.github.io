'use strict';
// ==========================================
// SCRIPT DE EXTRACCIÓN INDESIGN (CLI)
// ==========================================
function logToUI(mensaje) {
    console.log(mensaje);
}
try {
    logToUI("⏳ Iniciando script del plugin...");
    const indesign = require("indesign");
    const app = indesign.app;
    logToUI("✅ Módulos de InDesign cargados.");
    window.addEventListener("load", () => {
        logToUI("✅ Interfaz lista. Buscando botón...");
        const btn = document.getElementById("btnCompilar") || document.getElementById("btnProbar");
        if (!btn) {
            logToUI("❌ Error crítico: No se encontró ningún botón en el HTML.");
            return;
        }
        logToUI("✅ Botón vinculado correctamente.");
        btn.addEventListener("click", async () => {
            logToUI("----------------------------------");
            logToUI("🚀 Botón presionado. Leyendo documento...");
            try {
                if (!app || app.documents.length === 0) {
                    logToUI("❌ Error: No hay ningún documento abierto en InDesign.");
                    return;
                }
                const doc = app.activeDocument;
                const nombreBase = doc.name.replace(/\.indd$/i, "");
                const listaParrafos = [];
                logToUI(`📄 Documento activo: ${doc.name}`);
                logToUI(`Extrayendo historias...`);
                const stories = doc.stories;
                const numStories = stories.length;
                for (let s = 0; s < numStories; s++) {
                    const story = stories[s] || (stories.item && stories.item(s));
                    if (!story || !story.contents) continue;
                    const lineas = story.contents.split(/\r?\n/).filter(l => l.trim());
                    for (const linea of lineas) {
                        const textoLimpio = String(linea)
                            .replace(/[\u0000-\u001F\u007F-\u009F\uFEFF\u0003]/g, " ")
                            .replace(/\s+/g, " ")
                            .trim();
                        if (textoLimpio.length > 0) {
                            listaParrafos.push({
                                tipo: "texto_cuerpo",
                                texto: textoLimpio
                            });
                        }
                    }
                }
                logToUI(`✅ Extracción OK (${listaParrafos.length} párrafos).`);
                const jsonCrudo = {
                    documento: { 
                        titulo: nombreBase,
                        totalParrafos: listaParrafos.length,
                        fecha: new Date().toISOString()
                    },
                    contenido: listaParrafos
                };
                logToUI("🎉 ¡Extracción exitosa!");
                logToUI(`⏱️ Párrafos: ${listaParrafos.length}`);
            } catch (error) {
                logToUI(`❌ Error en el proceso: ${error.message}`);
                console.error(error);
            }
        });
    });
} catch (err) {
    logToUI("❌ Error fatal al iniciar: " + err.message);
    console.error(err);
}