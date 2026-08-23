#!/usr/bin/env node

/**
 * SCRIPT DE TESTING: test_compilador.js
 * Prueba toda la arquitectura moderna con datos reales
 * 
 * USO:
 *   node test_compilador.js <ruta_json_indesign> [opciones]
 * 
 * EJEMPLOS:
 *   node test_compilador.js ./publicaciones/Constitución_Política_Colombia/documento_req-uxp-1787442259035.json
 *   node test_compilador.js ./documentos/decreto252.json --validar --generar-toc
 */

const fs = require('fs');
const path = require('path');
const compilador = require('./compilarLexmotor_v2');

// Colores para consola
const COLORES = {
  RESET: '\x1b[0m',
  ROJO: '\x1b[31m',
  VERDE: '\x1b[32m',
  AMARILLO: '\x1b[33m',
  AZUL: '\x1b[36m',
  GRIS: '\x1b[90m'
};

/**
 * Función principal de testing
 */
async function main() {
  console.log(`${COLORES.AZUL}${'='.repeat(70)}`);
  console.log('TESTING - COMPILADOR LEXDIGITAL V2');
  console.log('='.repeat(70)}${COLORES.RESET}\n`);

  // Parsear argumentos
  const args = process.argv.slice(2);
  if (args.length === 0) {
    mostrarAyuda();
    process.exit(1);
  }

  const archivoJSON = args[0];
  const opciones = parsearOpciones(args.slice(1));

  // Verificar que el archivo existe
  if (!fs.existsSync(archivoJSON)) {
    console.error(`${COLORES.ROJO}✗ Archivo no encontrado: ${archivoJSON}${COLORES.RESET}`);
    process.exit(1);
  }

  console.log(`${COLORES.GRIS}Archivo: ${archivoJSON}${COLORES.RESET}`);

  try {
    // PASO 1: Cargar JSON
    console.log(`\n${COLORES.AZUL}[1/6] Cargando JSON...${COLORES.RESET}`);
    const jsonData = cargarJSON(archivoJSON);
    console.log(`${COLORES.VERDE}✓ JSON cargado: ${Object.keys(jsonData).join(', ')}${COLORES.RESET}`);

    // PASO 2: Analizar estructura
    console.log(`\n${COLORES.AZUL}[2/6] Analizando estructura...${COLORES.RESET}`);
    const stats = analizarJSON(jsonData);
    mostrarStats(stats);

    // PASO 3: Compilar a XHTML
    console.log(`\n${COLORES.AZUL}[3/6] Compilando a XHTML...${COLORES.RESET}`);
    const resultadoCompilacion = compilador.compilarAXHTML(jsonData, {
      validar: opciones.validar,
      generarTOC: opciones.generarTOC,
      nivelAccesibilidad: opciones.nivelAccesibilidad,
      idioma: 'es-CO'
    });

    if (!resultadoCompilacion.xhtml) {
      throw new Error('Compilación fallida: ' + JSON.stringify(resultadoCompilacion.errores));
    }

    console.log(`${COLORES.VERDE}✓ XHTML compilado: ${resultadoCompilacion.stats.bytesXHTML} bytes, ${resultadoCompilacion.stats.lineasXHTML} líneas${COLORES.RESET}`);

    // PASO 4: Validación
    console.log(`\n${COLORES.AZUL}[4/6] Validando XHTML...${COLORES.RESET}`);
    mostrarValidacion(resultadoCompilacion.validacion);

    // PASO 5: Mostrar metadatos
    console.log(`\n${COLORES.AZUL}[5/6] Metadatos${COLORES.RESET}`);
    mostrarMetadatos(resultadoCompilacion.metadatos);

    // PASO 6: Guardar archivos
    console.log(`\n${COLORES.AZUL}[6/6] Guardando archivos...${COLORES.RESET}`);
    const archivosGuardados = guardarArchivos(archivoJSON, resultadoCompilacion, opciones);
    console.log(`${COLORES.VERDE}✓ Archivos guardados:${COLORES.RESET}`);
    archivosGuardados.forEach(archivo => {
      console.log(`  - ${archivo}`);
    });

    // RESUMEN FINAL
    console.log(`\n${COLORES.VERDE}${'='.repeat(70)}`);
    console.log('✓ TESTING COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(70)}${COLORES.RESET}\n`);

    process.exit(0);

  } catch (error) {
    console.error(`\n${COLORES.ROJO}✗ ERROR: ${error.message}${COLORES.RESET}`);
    console.error(`${COLORES.GRIS}${error.stack}${COLORES.RESET}`);
    process.exit(1);
  }
}

/**
 * Parsea opciones de línea de comandos
 */
function parsearOpciones(args) {
  const opciones = {
    validar: true,
    generarTOC: true,
    nivelAccesibilidad: 'AA',
    guardarJSON: true,
    output: './output'
  };

  args.forEach((arg, i) => {
    if (arg === '--no-validar') opciones.validar = false;
    if (arg === '--no-toc') opciones.generarTOC = false;
    if (arg === '--nivel') opciones.nivelAccesibilidad = args[i + 1] || 'AA';
    if (arg === '--output') opciones.output = args[i + 1] || './output';
  });

  return opciones;
}

/**
 * Carga JSON de InDesign
 */
function cargarJSON(archivo) {
  const contenido = fs.readFileSync(archivo, 'utf-8');
  return JSON.parse(contenido);
}

/**
 * Analiza estructura del JSON
 */
function analizarJSON(jsonData) {
  const tokens = jsonData.tokens || jsonData.fragmentos || [];
  
  return {
    totalTokens: tokens.length,
    titulo: jsonData.documento?.titulo || jsonData.titulo || '(sin título)',
    tokenConFragmentos: tokens.filter(t => t.fragmentos && t.fragmentos.length > 0).length,
    estilosUnicos: [...new Set(tokens.map(t => t.estilo))],
    estilosCaracterUnicos: [...new Set(
      tokens.flatMap(t => 
        (t.fragmentos || []).map(f => f.estiloCaracter)
      ).filter(Boolean)
    )]
  };
}

/**
 * Muestra estadísticas
 */
function mostrarStats(stats) {
  console.log(`${COLORES.GRIS}Estadísticas:${COLORES.RESET}`);
  console.log(`  Título: ${stats.titulo}`);
  console.log(`  Total tokens: ${stats.totalTokens}`);
  console.log(`  Tokens con fragmentos: ${stats.tokenConFragmentos}`);
  console.log(`  Estilos únicos: ${stats.estilosUnicos.join(', ')}`);
  console.log(`  Estilos de carácter: ${stats.estilosCaracterUnicos.join(', ')}`);
}

/**
 * Muestra resultados de validación
 */
function mostrarValidacion(validacion) {
  if (!validacion) return;

  const estado = validacion.valido ? `${COLORES.VERDE}✓ VÁLIDO${COLORES.RESET}` : `${COLORES.ROJO}✗ INVÁLIDO${COLORES.RESET}`;
  console.log(`Estado: ${estado}`);
  console.log(`Errores: ${validacion.totalErrores}`);
  console.log(`Advertencias: ${validacion.totalAdvertencias}`);

  if (validacion.totalErrores > 0) {
    console.log(`${COLORES.ROJO}Errores detectados:${COLORES.RESET}`);
    validacion.errores.slice(0, 5).forEach(err => {
      console.log(`  ${COLORES.ROJO}•${COLORES.RESET} [${err.tipo}] ${err.mensaje}`);
    });
    if (validacion.totalErrores > 5) {
      console.log(`  ... y ${validacion.totalErrores - 5} más`);
    }
  }

  if (validacion.totalAdvertencias > 0) {
    console.log(`${COLORES.AMARILLO}Advertencias:${COLORES.RESET}`);
    validacion.advertencias.slice(0, 3).forEach(adv => {
      console.log(`  ${COLORES.AMARILLO}•${COLORES.RESET} [${adv.tipo}] ${adv.mensaje}`);
    });
  }
}

/**
 * Muestra metadatos
 */
function mostrarMetadatos(metadatos) {
  console.log(`${COLORES.GRIS}Estructura:${COLORES.RESET}`);
  if (metadatos.estructura) {
    const { porTipo, articulos, titulos } = metadatos.estructura;
    if (porTipo) {
      Object.entries(porTipo).forEach(([tipo, cantidad]) => {
        console.log(`  ${tipo}: ${cantidad}`);
      });
    }
  }
}

/**
 * Guarda archivos de salida
 */
function guardarArchivos(archivoJSON, resultado, opciones) {
  const archivosGuardados = [];
  
  // Crear directorio de output
  const outputDir = opciones.output;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const nombreBase = path.basename(archivoJSON, '.json');

  // Guardar XHTML
  if (resultado.xhtml) {
    const rutaXHTML = path.join(outputDir, `${nombreBase}.xhtml`);
    fs.writeFileSync(rutaXHTML, resultado.xhtml, 'utf-8');
    archivosGuardados.push(rutaXHTML);
  }

  // Guardar metadatos
  if (resultado.metadatos) {
    const rutaMeta = path.join(outputDir, `${nombreBase}.metadatos.json`);
    fs.writeFileSync(rutaMeta, JSON.stringify(resultado.metadatos, null, 2), 'utf-8');
    archivosGuardados.push(rutaMeta);
  }

  // Guardar validación
  if (resultado.validacion) {
    const rutaValidacion = path.join(outputDir, `${nombreBase}.validacion.json`);
    fs.writeFileSync(rutaValidacion, JSON.stringify(resultado.validacion, null, 2), 'utf-8');
    archivosGuardados.push(rutaValidacion);
  }

  return archivosGuardados;
}

/**
 * Muestra ayuda
 */
function mostrarAyuda() {
  console.log(`
${COLORES.AZUL}USO:${COLORES.RESET}
  node test_compilador.js <archivo_json> [opciones]

${COLORES.AZUL}OPCIONES:${COLORES.RESET}
  --no-validar           No validar XHTML (más rápido)
  --no-toc              No generar tabla de contenidos
  --nivel AA|A|AAA      Nivel de accesibilidad (default: AA)
  --output <directorio> Directorio de salida (default: ./output)

${COLORES.AZUL}EJEMPLOS:${COLORES.RESET}
  node test_compilador.js ./documento.json
  node test_compilador.js ./constitucion.json --no-validar
  node test_compilador.js ./decreto.json --output ./resultados --nivel AAA
`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  cargarJSON,
  analizarJSON,
  mostrarStats,
  mostrarValidacion
};
