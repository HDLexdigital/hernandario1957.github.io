// LexDigital_Certificar.jsx
// Guardián de Esquemas y Certificación de Fuente Única de Verdad
#include "polyfills/json2.jsx"

var RUTA_PROYECTO = "H:/LexDigital/Recursos/AUTOMATIZAR INDESIGN/proyecto-lexdigital_modular";
var RUTA_MANIFIESTO = RUTA_PROYECTO + "/templates/manifiesto-estilos.json";
var RUTA_SALIDA_CERTIFICADO = RUTA_PROYECTO + "/MisJSON/estilos_certificados.json";

function cargarManifiesto(rutaArchivo) {
    var archivo = new File(rutaArchivo);
    if (!archivo.exists) {
        throw new Error("CRITICAL: No se encontró el manifiesto ontológico en: " + rutaArchivo);
    }
    archivo.open("r");
    var contenido = archivo.read();
    archivo.close();
    return JSON.parse(contenido);
}

function auditarYCertificarDocumento() {
    if (app.documents.length === 0) {
        alert("ERROR: No hay ningún documento activo en Adobe InDesign.");
        return;
    }

    var doc = app.activeDocument;
    var manifiesto;
    
    try {
        manifiesto = cargarManifiesto(RUTA_MANIFIESTO);
    } catch (e) {
        alert(e.message);
        return;
    }

    var errores = [];
    var estilosDetectadosParrafo = {};
    var estilosDetectadosCaracter = {};

    // 1. Recorrer estilos de párrafo del documento activo
    var paraStyles = doc.allParagraphStyles;
    for (var i = 0; i < paraStyles.length; i++) {
        var ps = paraStyles[i];
        if (ps.name.indexOf('[') === 0 && ps.name !== '[Estilo básico de párrafo]') continue;
        
        estilosDetectadosParrafo[ps.name] = true;

        if (manifiesto.politicaGobernanza.fallFastOnError) {
            if (!manifiesto.mapeoEstilosParrafo[ps.name]) {
                errores.push("Estilo de párrafo huérfano detectado: '" + ps.name + "'. No existe mapeo semántico en el manifiesto.");
            }
        }
    }

    // 2. Recorrer estilos de carácter del documento activo
    var charStyles = doc.allCharacterStyles;
    for (var j = 0; j < charStyles.length; j++) {
        var cs = charStyles[j];
        if (cs.name.indexOf('[') === 0 && cs.name !== '[Ninguno]') continue;

        estilosDetectadosCaracter[cs.name] = true;

        if (manifiesto.politicaGobernanza.fallFastOnError) {
            if (!manifiesto.mapeoEstilosCaracter[cs.name]) {
                errores.push("Estilo de carácter huérfano detectado: '" + cs.name + "'. No existe mapeo semántico en el manifiesto.");
            }
        }
    }

    // 3. Evaluar política Fail Fast
    if (errores.length > 0) {
        var mensajeError = "GOBERNANZA EDITORIAL - CERTIFICACIÓN FALLIDA:\n\n" + errores.join("\n");
        alert(mensajeError);
        return { certificado: false, errores: errores };
    }

    // 4. Construir objeto certificado para el pipeline
    var paqueteCertificado = {
        documento: doc.name,
        timestamp: new Date().toISOString(),
        estadoCertificacion: "APROBADO",
        politica: manifiesto.politicaGobernanza,
        diccionarioParrafos: manifiesto.mapeoEstilosParrafo,
        diccionarioCaracteres: manifiesto.mapeoEstilosCaracter
    };

    var archivoSalida = new File(RUTA_SALIDA_CERTIFICADO);
    archivoSalida.encoding = "UTF-8";
    archivoSalida.open("w");
    archivoSalida.write(JSON.stringify(paqueteCertificado, null, 2));
    archivoSalida.close();

    alert("CERTIFICACIÓN EXITOSA:\nEl documento cumple con el contrato semántico y de accesibilidad.\nPayload guardado en:\n" + archivoSalida.fsName);
    return { certificado: true, ruta: archivoSalida.fsName };
}

auditarYCertificarDocumento();