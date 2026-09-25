const fs = require('fs');
const path = require('path');

try {
    const adapterModule = require('./src/adaptadores/InDesignAdapter.js');
    const adaptarInDesign = adapterModule.adaptarInDesign || adapterModule.default || adapterModule;

    const rawJsonPath = path.join(__dirname, 'MisJSON/fragmento_constitucion.json');
    const styleModelPath = path.join(__dirname, 'src/assets/style-model.json');
    
    // Limpieza explícita del BOM (\uFEFF) inyectado nativamente por InDesign
    const rawJsonString = fs.readFileSync(rawJsonPath, 'utf8').replace(/^\uFEFF/, '');
    const styleModelString = fs.readFileSync(styleModelPath, 'utf8').replace(/^\uFEFF/, '');
    
    const jsonCrudo = JSON.parse(rawJsonString);
    const semanticMap = JSON.parse(styleModelString);
    
    console.log('🔄 Ejecutando InDesignAdapter...');
    const resultado = adaptarInDesign({ jsonCrudo, semanticMap });
    
    // Búsqueda profunda (atrapa el array mute o no el input)
    let contenido = [];
    if (Array.isArray(resultado)) contenido = resultado;
    else if (resultado && resultado.ast && Array.isArray(resultado.ast.contenido)) contenido = resultado.ast.contenido;
    else if (resultado && Array.isArray(resultado.contenido)) contenido = resultado.contenido;
    else if (jsonCrudo && Array.isArray(jsonCrudo.contenido)) contenido = jsonCrudo.contenido;
    
    if (contenido.length === 0) {
        console.log("⚠️ El contenido sigue vacío. Volcando claves del resultado:");
        console.log(Object.keys(resultado));
    } else {
        console.log(`\n✅ Nodos encontrados: ${contenido.length}. Mostrando mapeo semántico:\n`);
        const muestra = contenido.slice(0, 5).map((nodo, i) => ({
            indice: i,
            estiloOrigen: nodo.estilo || nodo.inDesignStyle || '[Sin Estilo]',
            etiquetaHTML: nodo.resolvedTag || nodo.tag || '?',
            claseCSS: nodo.resolvedClass || nodo.class || '?',
            texto: typeof nodo.texto === 'string' 
                ? nodo.texto.substring(0, 45) + (nodo.texto.length > 45 ? '...' : '') 
                : '[Sin texto]'
        }));
        console.table(muestra);
    }
    
} catch (e) {
    console.error('❌ Error en la verificación:', e.message);
}
