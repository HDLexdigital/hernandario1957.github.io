const fs = require('fs');
const path = require('path');

const publicacionesDir = path.join(__dirname, '../publicaciones');

const documentosPrueba = {
    "defecto-json-incompleto": { contenido: `{ "metadata": { "titulo": "Ley 1" }, "content": [ { "type": "p" } `, ext: ".json" },
    "defecto-llaves": { contenido: `{ "metadata": { "titulo": "Ley 2" }, "content": [ { "type": "p" } ]`, ext: ".json" },
    "defecto-array-vacio": { contenido: JSON.stringify({ metadata: { titulo: "Ley 3" }, content: [] }, null, 2), ext: ".json" },
    "defecto-objeto-nulo": { contenido: JSON.stringify({ metadata: null, content: [{ type: "p" }] }, null, 2), ext: ".json" },
    "defecto-estilos": { contenido: JSON.stringify({ metadata: { titulo: "Ley 5" }, content: [{ type: "p", class: "P01_Body Base" }] }, null, 2), ext: ".json" },
    "defecto-bom": { contenido: '\uFEFF' + JSON.stringify({ metadata: { titulo: "Ley 6" }, content: [{ type: "p" }] }), ext: ".json" },
    "defecto-p-abierto": { contenido: JSON.stringify({ metadata: { titulo: "Ley 9" }, content: [{ type: "html", html: "<p class='p01-body-cont'>Texto sin cerrar" }] }, null, 2), ext: ".json" },
    "defecto-p-anidado": { contenido: JSON.stringify({ metadata: { titulo: "Ley 10" }, content: [{ type: "html", html: "<p><p>Anidamiento inválido</p></p>" }] }, null, 2), ext: ".json" },
    "defecto-sin-metadata": { contenido: JSON.stringify({ content: [{ type: "p" }] }, null, 2), ext: ".json" },
    "defecto-metadata-vacio": { contenido: JSON.stringify({ metadata: {}, content: [{ type: "p" }] }, null, 2), ext: ".json" },
    "defecto-metadata-tipo": { contenido: JSON.stringify({ metadata: "string-invalido", content: [{ type: "p" }] }, null, 2), ext: ".json" },
    "defecto-sin-contenido": { contenido: JSON.stringify({ metadata: { titulo: "Ley 15" } }, null, 2), ext: ".json" }
};

function generarDocumentos() {
    if (!fs.existsSync(publicacionesDir)) fs.mkdirSync(publicacionesDir, { recursive: true });

    Object.entries(documentosPrueba).forEach(([carpeta, config]) => {
        const dirPath = path.join(publicacionesDir, carpeta);
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
        const filePath = path.join(dirPath, `documento${config.ext}`);
        fs.writeFileSync(filePath, config.contenido, { encoding: 'utf8' });
        console.log(`[GENERADO] ${carpeta}/documento${config.ext}`);
    });

    console.log('✅ Generación de carga defectuosa completada.');
}

generarDocumentos();
