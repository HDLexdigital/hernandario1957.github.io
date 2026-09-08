#target indesign

var scriptPython = new File("H:/LexDigital/Recursos/AUTOMATIZAR INDESIGN/proyecto-lexdigital_modular/estilos/LexdigitalCSS.py");

if (scriptPython.exists) {
    scriptPython.execute();
} else {
    alert("No se encontró el archivo LexdigitalCSS.py en la ruta especificada.");
}