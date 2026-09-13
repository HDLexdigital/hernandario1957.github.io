# MANUAL DE GOBERNANZA Y FLUJO EDITORIAL JURÍDICO (LexDigitalHD 2.0)

Este documento establece el marco normativo, técnico y operativo para la recepción, curaduría, preparación y despliegue de textos jurídicos dentro de la plataforma **LexDigitalHD 2.0**. El cumplimiento riguroso de estas directrices garantiza la seguridad jurídica, la accesibilidad (WCAG 2.2 AA) y la integridad del motor de compilación industrial basado en Astro y Zod.

---

## 1. Fase de Alerta y Recepción de Textos Oficiales

La incorporación de nuevas normas o reformas al catálogo no responde a automatizaciones ciegas, sino a un modelo de **vigilancia asistida por humanos (Human-in-the-Loop)** para evitar la ingesta de borradores o errores de transcripción.

* **Canales de Monitoreo:** Revisión periódica de boletines de las altas cortes, gacetas oficiales y alertas parametrizadas con dominios institucionales (`.gov.co`).
* **Validación de la Fuente:** Ningún documento pasa a la fase de maquetación sin haber sido cotejado directamente contra la versión oficial publicada por la rama legislativa o ejecutiva correspondiente.

---

## 2. Fase de Cotejo y Depuración Previa (Microsoft Word)

Antes de importar cualquier texto al entorno de diseño, el documento base debe limpiarse y auditarse en un procesador de textos bajo estrictas normas de trazabilidad.

* **Control de Cambios:** Habilitar obligatoriamente la herramienta *Control de Cambios* (`Revisar > Control de cambios`) para registrar cada corrección de erratas, supresión o ajuste tipográfico realizado sobre el texto original de la gaceta.
* **Inspección de Metadatos:** Utilizar la herramienta *Inspeccionar documento* para eliminar metadatos ocultos, comentarios de revisión obsoletos o rastros de autoría que no correspondan al corpus legal.
* **Estandarización Tipográfica:** 
  * Eliminar dobles espacios y saltos de párrafo manuales innecesarios.
  * Unificar el uso de comillas y aplicar espacios inseparables (*non-breaking spaces*) en abreviaturas normativas recurrentes (`Art.`, `No.`, `Par.`).

---

## 3. Fase de Maquetación y Estructuración (Adobe InDesign)

Una vez importado el texto depurado, la maquetación debe regirse por un sistema estricto de estilos para permitir la correcta extracción automatizada.

* **Asignación de Estilos de Párrafo:** Está prohibido aplicar formato manual (negritas, tamaños arbitrarios o fuentes sueltas). Todo elemento debe vincularse a estilos tipográficos con nombres normalizados y unívocos:
  * `p02-title-main`: Títulos principales de la norma.
  * `titulo`: Divisiones mayores (Títulos / Secciones).
  * `capitulo`: Capítulos y artículos principales.
  * `p01-body-cont` / `p01-body-base`: Párrafos de articulado y texto base.
  * `glosario`: Términos definidos o notas al pie estructuradas.
* **Validación GREP:** Ejecutar expresiones regulares en InDesign para detectar inconsistencias en la numeración de artículos o espacios residuales antes de proceder a la exportación.

---

## 4. Conversión y Contrato de Datos Canónicos (JSON + Zod)

Los scripts de conversión (vía WSL2 / PowerShell / UXP) deben transformar el contenido maquetado en un archivo `.json` que cumpla estrictamente con el contrato validado por Zod en `src/content.config.ts`.

### Estructura Obligatoria del JSON Canónico
```json
{
  "titulo": "Denominación oficial de la norma o código",
  "descripcion": "Resumen ejecutivo o metadatos editoriales extraídos del documento.",
  "formato": "XHTML",
  "slug": "identificador-unico-url-norma",
  "contenidoHtml": "<h2>Capítulo I</h2><p>Artículo 1. Texto normativo estructurado...</p>"
}
mkdir -p docs
cat << 'EOF' > docs/FLUJO_EDITORIAL_JURIDICO.md
# MANUAL DE GOBERNANZA Y FLUJO EDITORIAL JURÍDICO (LexDigitalHD 2.0)

Este documento establece el marco normativo, técnico y operativo para la recepción, curaduría, preparación y despliegue de textos jurídicos dentro de la plataforma **LexDigitalHD 2.0**. El cumplimiento riguroso de estas directrices garantiza la seguridad jurídica, la accesibilidad (WCAG 2.2 AA) y la integridad del motor de compilación industrial basado en Astro y Zod.

---

## 1. Fase de Alerta y Recepción de Textos Oficiales

La incorporación de nuevas normas o reformas al catálogo no responde a automatizaciones ciegas, sino a un modelo de **vigilancia asistida por humanos (Human-in-the-Loop)** para evitar la ingesta de borradores o errores de transcripción.

* **Canales de Monitoreo:** Revisión periódica de boletines de las altas cortes, gacetas oficiales y alertas parametrizadas con dominios institucionales (`.gov.co`).
* **Validación de la Fuente:** Ningún documento pasa a la fase de maquetación sin haber sido cotejado directamente contra la versión oficial publicada por la rama legislativa o ejecutiva correspondiente.

---

## 2. Fase de Cotejo y Depuración Previa (Microsoft Word)

Antes de importar cualquier texto al entorno de diseño, el documento base debe limpiarse y auditarse en un procesador de textos bajo estrictas normas de trazabilidad.

* **Control de Cambios:** Habilitar obligatoriamente la herramienta *Control de Cambios* (`Revisar > Control de cambios`) para registrar cada corrección de erratas, supresión o ajuste tipográfico realizado sobre el texto original de la gaceta.
* **Inspección de Metadatos:** Utilizar la herramienta *Inspeccionar documento* para eliminar metadatos ocultos, comentarios de revisión obsoletos o rastros de autoría que no correspondan al corpus legal.
* **Estandarización Tipográfica:** 
  * Eliminar dobles espacios y saltos de párrafo manuales innecesarios.
  * Unificar el uso de comillas y aplicar espacios inseparables (*non-breaking spaces*) en abreviaturas normativas recurrentes (`Art.`, `No.`, `Par.`).

---

## 3. Fase de Maquetación y Estructuración (Adobe InDesign)

Una vez importado el texto depurado, la maquetación debe regirse por un sistema estricto de estilos para permitir la correcta extracción automatizada.

* **Asignación de Estilos de Párrafo:** Está prohibido aplicar formato manual (negritas, tamaños arbitrarios o fuentes sueltas). Todo elemento debe vincularse a estilos tipográficos con nombres normalizados y unívocos:
  * `p02-title-main`: Títulos principales de la norma.
  * `titulo`: Divisiones mayores (Títulos / Secciones).
  * `capitulo`: Capítulos y artículos principales.
  * `p01-body-cont` / `p01-body-base`: Párrafos de articulado y texto base.
  * `glosario`: Términos definidos o notas al pie estructuradas.
* **Validación GREP:** Ejecutar expresiones regulares en InDesign para detectar inconsistencias en la numeración de artículos o espacios residuales antes de proceder a la exportación.

---

## 4. Conversión y Contrato de Datos Canónicos (JSON + Zod)

Los scripts de conversión (vía WSL2 / PowerShell / UXP) deben transformar el contenido maquetado en un archivo `.json` que cumpla estrictamente con el contrato validado por Zod en `src/content.config.ts`.

### Estructura Obligatoria del JSON Canónico
```json
{
  "titulo": "Denominación oficial de la norma o código",
  "descripcion": "Resumen ejecutivo o metadatos editoriales extraídos del documento.",
  "formato": "XHTML",
  "slug": "identificador-unico-url-norma",
  "contenidoHtml": "<h2>Capítulo I</h2><p>Artículo 1. Texto normativo estructurado...</p>"
}
Escritura Atómica: Los scripts de exportación deben generar archivos temporales (.json.tmp) y realizar un reemplazo seguro (fs.renameSync) para evitar lecturas parciales por parte del Watchdog local.

Codificación UTF-8 sin BOM: Se prohíbe terminantemente la presencia de marcas de orden de bytes (BOM) para prevenir la corrupción de caracteres especiales y tildes en el entorno web.

5. Depósito, Compilación Local y Despliegue (CI/CD)
Una vez verificado el JSON, el ciclo culmina con la integración en el repositorio y la publicación en la nube.

Depósito Fijo: El archivo JSON validado se almacena en la ruta canónica src/content/normas/ del proyecto.

Validación y Previsualización Local: Ejecutar npm run dev para verificar en http://localhost:4321 que el visor procese correctamente el contenido, mantenga la accesibilidad WCAG y cumpla con la jerarquía visual.

Control de Versiones y Sincronización: Consolidar los cambios mediante control de versiones (git add y git commit) y realizar el envío al repositorio remoto (git push origin main).

Despliegue Desatendido (Cloudflare Pages): El webhook conectado con GitHub detecta el nuevo commit, ejecuta de forma automática el compilador industrial de Astro en la nube y actualiza la CDN global con la nueva norma de manera instantánea.
