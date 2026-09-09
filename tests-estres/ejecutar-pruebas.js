const fs = require('fs');
const path = require('path');

const publicacionesDir = path.join(__dirname, '../publicaciones');
const reportePath = path.join(__dirname, 'reporte-defectos.json');
const diccionario = require('../modelos-referencia/diccionario-defectos.json');

const reportes = [];

function evaluarDocumento(carpeta, contenidoBruto) {
    const log = {
        archivo: `${carpeta}/documento.json`,
        fecha: new Date().toISOString().split('T')[0],
        estado: "RECHAZADO"
    };

    if (contenidoBruto.charCodeAt(0) === 0xFEFF) {
        return { ...log, severidad: "ALTA", tipoDefecto: "BOM detectado", mensaje: "El archivo contiene un Byte Order Mark", recomendacion: "Limpiar el buffer con .replace(/^\\uFEFF/, '')" };
    }

    let ast;
    try {
        ast = JSON.parse(contenidoBruto);
    } catch (error) {
        return { ...log, severidad: "CRITICA", tipoDefecto: "JSON incompleto/malformado", mensaje: error.message, recomendacion: "Verificar cierres de llaves/corchetes." };
    }

    if (!ast.metadata || Object.keys(ast.metadata).length === 0 || typeof ast.metadata !== 'object') {
        return { ...log, severidad: "ALTA", tipoDefecto: "Metadata inválida", mensaje: "Falta el nodo metadata o está vacío", recomendacion: "Incluir objeto metadata válido." };
    }

    if (!ast.content || !Array.isArray(ast.content) || ast.content.length === 0) {
        return { ...log, severidad: "ALTA", tipoDefecto: "Sin contenido", mensaje: "El array 'content' no existe o está vacío", recomendacion: "Asegurar extracción de nodos de texto." };
    }

    return { ...log, estado: "OK", mensaje: "Validación superada." };
}

function ejecutarPruebas() {
    const carpetas = fs.readdirSync(publicacionesDir);

    carpetas.forEach(carpeta => {
        const filePath = path.join(publicacionesDir, carpeta, 'documento.json');
        if (fs.existsSync(filePath)) {
            const contenidoBruto = fs.readFileSync(filePath, 'utf8');
            const resultado = evaluarDocumento(carpeta, contenidoBruto);
            if (resultado.estado !== "OK") reportes.push(resultado);
        }
    });

    fs.writeFileSync(reportePath, JSON.stringify(reportes, null, 2));
    console.log(`✅ Pruebas finalizadas. Se registraron ${reportes.length} defectos en reporte-defectos.json`);
}

ejecutarPruebas();
