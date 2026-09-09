const fs = require('fs');
const path = require('path');

const reportePath = path.join(__dirname, 'reporte-soluciones-avanzado.json');
const reportes = JSON.parse(fs.readFileSync(reportePath, 'utf8'));

function aplicarCorreccion(archivo, paraTecnico) {
    const rutaOriginal = path.join(process.cwd(), 'publicaciones', archivo);
    if (!fs.existsSync(rutaOriginal)) return;

    const contenido = fs.readFileSync(rutaOriginal, 'utf8');

    // Aplicar corrección según instrucción
    let corregido = contenido;

    if (paraTecnico.instruccion.includes('Cerrar todas las llaves y corchetes')) {
        corregido = corregido.trim();
        let abiertasLlaves = (corregido.match(/{/g) || []).length;
        let cerradasLlaves = (corregido.match(/}/g) || []).length;
        let abiertosCorchetes = (corregido.match(/\[/g) || []).length;
        let cerradosCorchetes = (corregido.match(/\]/g) || []).length;

        while (cerradosCorchetes < abiertosCorchetes) {
            corregido += ']';
            cerradosCorchetes++;
        }

        while (cerradasLlaves < abiertasLlaves) {
            corregido += '}';
            cerradasLlaves++;
        }
    }

    if (paraTecnico.instruccion.includes('BOM')) {
        corregido = corregido.replace(/^\uFEFF/, '');
    }

    if (paraTecnico.instruccion.includes('metadata')) {
        // Añadir metadata si falta
        if (!corregido.includes('"metadata"')) {
            corregido = corregido.replace('{', '{"metadata":{"titulo":"Documento corregido"},"idioma":"es"},');
        }
    }

    if (paraTecnico.instruccion.includes('content')) {
        // Asegurar content array
        if (!corregido.includes('"content"')) {
            corregido = corregido.replace(/\}$/, ',"content":[{"type":"p","text":"Texto normativo"}]}');
        }
    }

    // Guardar archivo corregido
    const rutaCorregido = rutaOriginal.replace('.json', '.corregido.json');
    fs.writeFileSync(rutaCorregido, corregido, 'utf8');
    console.log(`✅ Corregido: ${path.basename(rutaCorregido)}`);
}

reportes.forEach(reporte => {
    if (reporte.estado === 'RECHAZADO' && reporte.para_tecnico !== 'Revisar manualmente el archivo.') {
        aplicarCorreccion(reporte.archivo, reporte.para_tecnico);
    }
});

console.log('✅ Proceso de corrección automática finalizado.');
