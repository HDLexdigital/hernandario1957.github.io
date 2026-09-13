# Cómo agregar contenido

Guía para agregar normas, jurisprudencia, publicaciones y datos al sitio.

## Normas

Las normas viven en src/content/normas/ como archivos Markdown.

### Estructura de una norma

Cada archivo .md tiene un frontmatter YAML con metadatos y un cuerpo
Markdown con el texto de la norma.

Ejemplo de frontmatter:

    ---
    title: "Ley de Contrato de Trabajo"
    tipo: ley
    numero: "20.744"
    fecha: 1976-09-05
    resumen: "Regula el contrato individual de trabajo en Argentina."
    materia: laboral
    vigente: true
    ---

    # Ley de Contrato de Trabajo

    ## Artículo 1°

    Texto del artículo...
    (hasta 30 artículos)

### Campos obligatorios

- title (string) — título completo de la norma
- tipo (enum) — ley, decreto, resolucion, ordenanza
- fecha (date) — fecha de sanción o publicación

### Campos opcionales

- numero (string) — número de la norma
- resumen (string) — descripción corta para las cards
- materia (string) — laboral, civil, penal, administrativo, etc.
- vigente (boolean, default true) — indica si está vigente

### Cómo crear una norma nueva

1. Crear el archivo: src/content/normas/mi-norma.md
2. Agregar el frontmatter YAML con los campos
3. Escribir el cuerpo en Markdown con headings ## para artículos
4. Guardar y verificar en /normativa

Si el frontmatter no cumple el schema Zod, el build falla con un
error claro indicando qué campo falta o está mal.

## Generación automática

Para regenerar las 10 normas ficticias de prueba:

    node scripts/seed-normas.mjs

Este script sobreescribe los archivos en src/content/normas/ con
contenido generado. Útil para desarrollo y pruebas.

## Datos auxiliares (JSON)

Los archivos JSON que no encajan en una colección viven en src/data/.

Se importan directamente desde cualquier componente:

    import datos from '../data/mi-archivo.json';

No se validan con Zod, así que hay que asegurar manualmente que la
estructura sea la esperada.

## Convenciones de nombres

- Archivos de normas: tipo-numero-materia.md (ej: ley-20744-laboral.md)
- Números siempre con puntos: "20.744" en vez de "20744"
- Fechas en formato ISO: YYYY-MM-DD
- Materia en minúscula, singular: laboral, civil, penal

## Errores comunes

Error: "frontmatter does not match collection schema"

Causa: algún campo obligatorio falta o tiene el tipo incorrecto.
Solución: revisar el frontmatter contra el schema en src/content/config.ts.

Error: "contains a mix of content and data entries"

Causa: hay archivos .md y .json mezclados en la misma carpeta
de colección. Solución: separar en dos colecciones distintas.

## Publicaciones (próximamente)

El catálogo comercial todavía no está implementado. Cuando se agregue,
las publicaciones vivirán en src/content/publicaciones/ con un schema
distinto que incluirá precio, portada, formatos disponibles, etc.
