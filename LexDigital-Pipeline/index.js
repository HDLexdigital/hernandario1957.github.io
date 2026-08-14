function logToUI(mensaje) {
    // El servidor backend solo registra en la terminal con console.log
    console.log(mensaje);
}
// Bloque principal protegido contra fallos de carga
try {
    logToUI("⏳ Iniciando script del plugin...");
    
    const indesign = require("indesign");
    const app = indesign.app;
    const { enviarAlPipeline } = require("./api/lexdigitalClient.js");

    logToUI("✅ Módulos de InDesign cargados.");

    window.addEventListener("load", () => {
        logToUI("✅ Interfaz lista. Buscando botón...");
        
        const btn = document.getElementById("btnCompilar");
        
        if (!btn) {
            logToUI("❌ Error crítico: No se encontró el botón #btnCompilar en el HTML.");
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
                for (let s = 0; s < stories.length; s++) {
                    const story = stories.item(s);
                    for (let p = 0; p < story.paragraphs.length; p++) {
                        const contenidoTexto = story.paragraphs.item(p).contents;
                        if (!contenidoTexto) continue;

                        const textoLimpio = String(contenidoTexto)
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
                logToUI(`Enviando al servidor (WebSocket)...`);

                const jsonCrudo = {
                    documento: { titulo: nombreBase },
                    contenido: listaParrafos
                };

                const resultado = await enviarAlPipeline(jsonCrudo, nombreBase);

                logToUI("🎉 ¡Compilación exitosa!");
                logToUI(`⏱️ Tiempo: ${resultado.metadatos?.tiempoTotal || 'N/A'}ms`);

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