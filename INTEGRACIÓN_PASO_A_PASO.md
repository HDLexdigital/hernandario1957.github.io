# 🚀 GUÍA DE INTEGRACIÓN - Fase 1 XHTML

**Tiempo estimado:** 15-20 minutos  
**Complejidad:** Media  
**Requiere:** Node.js 14+, acceso a tu proyecto

---

## 📋 PASO 1: Preparar tu máquina

### 1.1 Verifica Node.js
```bash
node --version
npm --version
# Debe ser >= 14.0.0
```

### 1.2 Ten a mano tu proyecto
```bash
cd H:\LexDigital\Recursos\AUTOMATIZAR INDESIGN\LexDigital_Style_Exporter
ls -la src/core/
```

Deberías ver archivos como:
- `constructorXHTML.js` (el actual - lo vamos a mantener como backup)
- `validadorJson.js`
- `clasificadorLegal.js`

---

## 📂 PASO 2: Copiar los 5 módulos nuevos

**Tienes 2 opciones:**

### Opción A: Copiar desde Terminal (Recomendado)
Los 5 archivos están en `/home/claude/lexdigital_modular_v2/`:

```bash
# Copiar los 5 módulos nuevos a tu proyecto
cp /home/claude/lexdigital_modular_v2/fragmentProcesador.js src/core/
cp /home/claude/lexdigital_modular_v2/juridicoParser.js src/core/
cp /home/claude/lexdigital_modular_v2/xhtmlBuilder.js src/core/
cp /home/claude/lexdigital_modular_v2/ariaMapper.js src/core/
cp /home/claude/lexdigital_modular_v2/xhtmlValidator.js src/core/

# Copiar el compilador refactorizado
cp /home/claude/lexdigital_modular_v2/compilarLexmotor_v2.js src/core/

# Copiar el script de testing
cp /home/claude/lexdigital_modular_v2/test_compilador.js ./
```

### Opción B: Copiar Manualmente
1. Abre cada archivo en `/home/claude/lexdigital_modular_v2/`
2. Copia el contenido
3. Pega en `src/core/` de tu proyecto con el mismo nombre

---

## 🔧 PASO 3: Actualizar `index.js`

Tu `index.js` actual importa `compilarLexmotor.js`. Necesitas actualizarlo para usar la versión nueva:

### 3.1 Reemplazar el require
```javascript
// ANTES (línea 8):
const { compilarLexmotor } = require('./src/core/compilarLexmotor');

// DESPUÉS:
const compilador = require('./src/core/compilarLexmotor_v2');
```

### 3.2 Actualizar la función de compilación
```javascript
// ANTES (línea ~40):
async function procesarArchivo(jsonData) {
  try {
    const resultado = compilarLexmotor(jsonData);
    // ...
  }
}

// DESPUÉS:
async function procesarArchivo(jsonData) {
  try {
    const resultado = compilador.compilarAXHTML(jsonData, {
      titulo: 'Mi Documento',
      idioma: 'es-CO',
      validar: true,
      generarTOC: true,
      nivelAccesibilidad: 'AA'
    });
    
    if (!resultado.xhtml) {
      console.error('Error en compilación:', resultado.errores);
      return null;
    }
    
    return resultado;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
```

### 3.3 Guardar XHTML
```javascript
// Agregar esta función para guardar el output
function guardarXHTML(resultado, nombreArchivo) {
  const fs = require('fs');
  const path = require('path');
  
  const outputDir = './publicaciones/output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const rutaXHTML = path.join(outputDir, `${nombreArchivo}.xhtml`);
  fs.writeFileSync(rutaXHTML, resultado.xhtml, 'utf-8');
  
  console.log(`✓ XHTML guardado: ${rutaXHTML}`);
  console.log(`  - Bytes: ${resultado.stats.bytesXHTML}`);
  console.log(`  - Líneas: ${resultado.stats.lineasXHTML}`);
  console.log(`  - Errores: ${resultado.validacion.totalErrores}`);
  console.log(`  - Advertencias: ${resultado.validacion.totalAdvertencias}`);
  
  return rutaXHTML;
}
```

---

## 🧪 PASO 4: Testear con datos reales

### 4.1 Testear con un archivo pequeño primero
```bash
# Navega a tu proyecto
cd H:\LexDigital\Recursos\AUTOMATIZAR INDESIGN\LexDigital_Style_Exporter

# Ejecuta el test con fragmento
node test_compilador.js ./publicaciones/fragmento/documento_req-uxp-*.json --output ./output_test

# Verifica los archivos generados
ls -la output_test/
```

Deberías ver:
- `*.xhtml` - El XHTML compilado
- `*.metadatos.json` - Estructura detectada
- `*.validacion.json` - Resultados de validación

### 4.2 Testear con documento completo
```bash
# Prueba con la Constitución
node test_compilador.js ./publicaciones/Constitución_Política_Colombia/documento_req-uxp-*.json --output ./output_constitucion

# O con decreto
node test_compilador.js ./publicaciones/decreto252/documento_req-uxp-*.json --output ./output_decreto
```

### 4.3 Ver resultados
```bash
# Abre el XHTML en tu navegador
# Windows:
start output_constitucion/*.xhtml

# Linux/Mac:
open output_constitucion/*.xhtml

# O editamente:
cat output_constitucion/*.xhtml | head -50
```

---

## 🔍 PASO 5: Integrar en tu pipeline actual

### 5.1 Conectar con batchProcessor
Si usas `batchProcessor.js`, modifica el procesamiento:

```javascript
// En batchProcessor.js, reemplaza procesarDocumento():
async procesarDocumento(rutaJSON, nombreSalida) {
  const fs = require('fs');
  const compilador = require('./compilarLexmotor_v2');
  
  try {
    // 1. Cargar JSON
    const jsonData = JSON.parse(fs.readFileSync(rutaJSON, 'utf-8'));
    
    // 2. Compilar
    const resultado = compilador.compilarAXHTML(jsonData, {
      validar: true,
      generarTOC: true,
      nivelAccesibilidad: 'AA'
    });
    
    if (!resultado.xhtml) {
      throw new Error(resultado.errores[0].mensaje);
    }
    
    // 3. Guardar
    const outputDir = './publicaciones/output';
    fs.mkdirSync(outputDir, { recursive: true });
    
    fs.writeFileSync(
      `${outputDir}/${nombreSalida}.xhtml`,
      resultado.xhtml,
      'utf-8'
    );
    
    // 4. Log
    this.agregarLog(`✓ ${nombreSalida}: compilado`);
    
    return {
      exito: true,
      ruta: `${outputDir}/${nombreSalida}.xhtml`,
      bytes: resultado.stats.bytesXHTML
    };
    
  } catch (error) {
    this.agregarLog(`✗ ${nombreSalida}: ${error.message}`);
    return { exito: false, error: error.message };
  }
}
```

### 5.2 Procesar múltiples documentos
```bash
# Crear archivo proceso_batch.js
node -e "
const batchProcessor = require('./interfaces/batchProcessor');
const processor = new batchProcessor();

processor.procesarDirectorio(
  './publicaciones',
  {
    patron: 'documento_req-uxp-*.json',
    salida: './output'
  }
);
"
```

---

## ✅ PASO 6: Verificar que funciona

### Checklist de validación:
```bash
# 1. ¿Se generan los XHTML?
ls -la output_test/*.xhtml | wc -l
# Debe mostrar > 0

# 2. ¿Son válidos (estructura)?
grep -c "<?xml\|<!DOCTYPE" output_test/*.xhtml
# Debe mostrar > 0

# 3. ¿Tienen ARIA?
grep -c "role=" output_test/*.xhtml
# Debe mostrar > 0

# 4. ¿Tienen TOC?
grep -c "<nav id=\"toc\"" output_test/*.xhtml
# Debe mostrar > 0

# 5. ¿Están procesados los fragmentos?
grep -c "<mark.*role=\"term\"" output_test/*.xhtml
# Debe mostrar > 0
```

### Si todo está verde:
```bash
✓ Estructura XHTML correcta
✓ DOCTYPE y XML declaration
✓ ARIA completo
✓ TOC generado
✓ Fragmentos procesados
✓ LISTO PARA PRODUCCIÓN
```

---

## 🛠️ PASO 7: Opciones avanzadas

### Cambiar nivel de accesibilidad
```javascript
const resultado = compilador.compilarAXHTML(jsonData, {
  nivelAccesibilidad: 'AAA'  // Más estricto
});
```

### Personalizar mapeo de estilos
```javascript
const mapeoPersonalizado = {
  'MI_ESTILO_CUSTOM': {
    etiqueta: 'div',
    clase: 'mi-clase',
    nivel: 1
  }
};

const resultado = compilador.compilarAXHTML(jsonData, {
  mapeoEstilos: mapeoPersonalizado
});
```

### Deshabilitar validación (más rápido)
```javascript
const resultado = compilador.compilarAXHTML(jsonData, {
  validar: false
});
```

---

## 📞 PASO 8: Troubleshooting

### Error: "Cannot find module"
```bash
# Verifica que los 5 archivos están en src/core/
ls -la src/core/fragmentProcesador.js
ls -la src/core/juridicoParser.js
ls -la src/core/xhtmlBuilder.js
ls -la src/core/ariaMapper.js
ls -la src/core/xhtmlValidator.js
```

### XHTML no se genera
```bash
# Revisa los errores detallados
node -e "
const compilador = require('./src/core/compilarLexmotor_v2');
const fs = require('fs');
const json = JSON.parse(fs.readFileSync('./test.json'));
const resultado = compilador.compilarAXHTML(json);
console.log(JSON.stringify(resultado.errores, null, 2));
"
```

### Validación falla
```bash
# Desactiva validación estricta temporalmente
const resultado = compilador.compilarAXHTML(jsonData, {
  validar: false
});
```

---

## 🎉 ¡LISTO!

Una vez completados estos pasos:

✓ **Tienes XHTML funcional en producción** (HOY)  
✓ **Con accesibilidad ARIA WCAG 2.1 AA**  
✓ **Con fragmentos internos procesados**  
✓ **Con estructura jurídica detectada**  
✓ **Con validación XHTML automática**  

**Próximo paso:** Mañana, implementamos EPUB3 y PDF/UA en Fase 2.

---

## 📝 Logs esperados

```
[compilarLexmotor_v2] Iniciando compilación a XHTML...
[compilarLexmotor_v2] Builder creado. Título: "Constitución Política de Colombia"
[compilarLexmotor_v2] XHTML generado exitosamente
[compilarLexmotor_v2] ARIA agregado correctamente
[compilarLexmotor_v2] Validación completada: 0 errores, 2 advertencias
[compilarLexmotor_v2] ✓ Compilación completada exitosamente

✓ XHTML compilado: 247856 bytes, 1243 líneas
✓ XHTML guardado: ./output_constitucion/constitucion.xhtml
```

¡Éxito! 🚀
