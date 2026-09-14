# Guía de contenido — LexDigitalHD

Esta guía explica cómo agregar, editar o quitar contenido del sitio
sin necesidad de saber programar.

## 1. Antes de empezar

### 1.1 Qué podés hacer con esta guía

- Agregar una publicación nueva al catálogo
- Agregar una norma nueva
- Editar el título, precio, autor, resumen de un producto
- Cambiar la portada de un producto
- Marcar productos como destacados o novedades
- Corregir textos de páginas existentes

### 1.2 Qué NO podés hacer (requiere programador)

- Crear páginas nuevas
- Cambiar el menú de navegación
- Modificar componentes (botones, cards, formularios)
- Cambiar colores del sitio
- Integrar sistemas de pago

### 1.3 Herramientas que vas a usar

- **VS Code** — editor para abrir y modificar archivos
- **Terminal** — para correr comandos
- **Navegador** — para ver los cambios en vivo

### 1.4 Reglas de oro

- **Nunca** modificar archivos que terminen en `.astro` si no sabés qué son
- **Siempre** verificar en el navegador después de cada cambio
- **Siempre** hacer commit después de un cambio correcto
- Si algo se rompe, avisar antes de tocar más

## 2. Flujo de trabajo básico

Cada vez que quieras hacer un cambio, seguí estos pasos:

1. Abrí VS Code en la carpeta del proyecto
2. Abrí una terminal (dentro de VS Code: Ctrl + `)
3. Corré `npm run dev` para ver el sitio en vivo
4. Abrí el navegador en http://localhost:4321
5. Hacé el cambio en el archivo correspondiente
6. Guardá con Ctrl + S
7. Verificá en el navegador (recargá con Ctrl + Shift + R)
8. Si está bien, hacé commit (ver sección 6)
9. Si algo falla, deshacé el cambio

## 3. Cómo agregar una publicación nueva

Una publicación es un producto del catálogo: un libro, una guía, una
revista. Cada publicación vive en su propio archivo `.md`.

### Paso a paso

**Paso 1** — Abrí VS Code y andá a la carpeta:
    src/content/publicaciones/

**Paso 2** — Mirá las publicaciones que ya existen. Por ejemplo:
    guia-derechos-ciudadanos.md
    contrato-trabajo-comentado.md
    revista-juridica-trimestral.md

**Paso 3** — Abrí una de ellas haciendo doble click. Vas a ver algo así:

    ---
    sku: "LDH-PAGO-001"
    titulo: "Contrato de Trabajo Comentado"
    ...
    ---

    # Contrato de Trabajo Comentado

    Texto del contenido...

**Paso 4** — Copiá el archivo completo:
    Click derecho sobre el archivo → Copy
    Click derecho sobre la carpeta → Paste

**Paso 5** — Renombrá el archivo nuevo:
    Click derecho → Rename
    Ponele un nombre descriptivo en minúsculas con guiones:
    mi-publicacion-nueva.md

**Paso 6** — Editá los campos del frontmatter (lo que está entre los
dos `---`). Cada campo tiene un propósito:

| Campo | Qué poner | Obligatorio |
|---|---|---|
| sku | Código único del producto (ej: LDH-PAGO-005) | Sí |
| titulo | Nombre completo del producto | Sí |
| subtitulo | Frase secundaria | No |
| autores | Lista de autores (uno por línea con guión) | Sí |
| coleccion | Serie a la que pertenece (ej: Códigos Comentados) | No |
| materia | Categorías (laboral, civil, etc.) | Sí |
| idioma | es, en o pt | No (default: es) |
| publico | profesional, academico o general | No |
| tags | Palabras clave para búsqueda | No |
| tipoAcceso | gratis, pago o suscripcion | Sí |
| precioCOP | Precio en pesos colombianos (sin puntos) | Si es pago |
| precioUSD | Precio en dólares | No |
| descuentoPorcentaje | 0 a 100 (ej: 10 = 10% off) | No |
| formatos | Lista: html, epub, pdf-accesible, pdf-fijo, pwa | Sí |
| portada | Ruta a la imagen (ej: /portadas/mi-libro.webp) | Sí |
| portadaAlt | Descripción de la imagen para accesibilidad | Sí |
| paginas | Número de páginas | No |
| isbn | Código ISBN | No |
| fechaPublicacion | Formato YYYY-MM-DD | Sí |
| edicion | Número de edición (1, 2, 3...) | No |
| version | Versión (ej: 1.0.0) | No |
| resumenCorto | Máximo 280 caracteres | Sí |
| resumenLargo | Descripción extendida | No |
| destacado | true o false | No |
| novedad | true o false | No |

**Paso 7** — Después del segundo `---`, escribí el contenido del producto
en formato Markdown. Es como escribir un documento normal, con algunos
símbolos especiales:

    # Título de primer nivel (ya está en el frontmatter)

    ## Sección

    Párrafo normal.

    ### Subsección

    Otro párrafo.

**Paso 8** — Guardá el archivo con Ctrl + S.

**Paso 9** — Andá al navegador y recargá el catálogo:
    http://localhost:4321/catalogo

**Paso 10** — Verificá que tu publicación aparece con su portada y precio.

## 4. Cómo agregar una norma nueva

Las normas viven en: src/content/normas/

### Estructura de una norma

Cada archivo `.md` tiene un frontmatter más simple que las publicaciones:

    ---
    title: "Ley de Contrato de Trabajo"
    tipo: ley
    numero: "20.744"
    fecha: 1976-09-05
    resumen: "Regula el contrato individual de trabajo"
    materia: laboral
    vigente: true
    ---

    # Ley de Contrato de Trabajo

    ## Artículo 1°

    Texto del artículo...

    ## Artículo 2°

    Texto del artículo...

### Campos del frontmatter

| Campo | Valores posibles | Obligatorio |
|---|---|---|
| title | Texto | Sí |
| tipo | ley, decreto, resolucion, ordenanza | No |
| numero | Texto (ej: "20.744") | No |
| fecha | YYYY-MM-DD | No |
| resumen | Una línea corta | No |
| materia | laboral, civil, penal, etc. | No |
| vigente | true o false | No |

### Generación automática

Si querés generar 10 normas ficticias para pruebas, corré en la terminal:

    node scripts/seed-normas.mjs

Eso sobreescribe las normas existentes. **Cuidado: no lo corras si tenés
normas reales cargadas.**

## 5. Cómo agregar imágenes (portadas)

### Paso 1 — Preparar la imagen

- Formato: **WebP** (preferido) o JPG
- Tamaño ideal: **600 × 800 px** (aspect ratio 3:4)
- Peso: menos de 100 KB si es posible
- Nombre: en minúsculas, con guiones, sin acentos
  Ejemplo: `mi-publicacion-nueva.webp`

### Paso 2 — Copiar a la carpeta

Copiá el archivo a:

    public/portadas/

### Paso 3 — Referenciarla en el frontmatter

En el archivo `.md` de la publicación:

    portada: "/portadas/mi-publicacion-nueva.webp"
    portadaAlt: "Portada del libro Mi Publicación Nueva"

**IMPORTANTE:** el campo `portadaAlt` es obligatorio y debe describir
la imagen con palabras (no "imagen" ni "portada"). Es un requisito
de accesibilidad.

## 6. Cómo editar contenido existente

### Cambiar el precio

1. Abrí el archivo `.md` de la publicación
2. Buscá `precioCOP:`
3. Cambiá el número
4. Guardá

### Cambiar el título

1. Abrí el archivo
2. Cambiá `titulo: "..."` en el frontmatter
3. **También** cambiá el `# Título` del cuerpo (si querés que coincidan)
4. Guardá

### Marcar como destacado o novedad

Buscá en el frontmatter:
    destacado: false
    novedad: false

Y cambiá a `true` el que quieras.

## 7. Cómo guardar los cambios (commit)

Después de verificar que el cambio funciona en el navegador:

**Paso 1** — En la terminal, corré:
    cd /home/donache/LexDigitalHD-web
    git status

Vas a ver una lista de archivos modificados.

**Paso 2** — Agregá todos los cambios:
    git add -A

**Paso 3** — Hacé el commit con un mensaje descriptivo:
    git commit -m "Agregada publicación: Mi Publicación Nueva"

El mensaje debe describir QUÉ cambiaste, no cómo.

**Paso 4** — Verificá que quedó bien:
    git log --oneline -3

Debería aparecer tu commit arriba del historial.

## 8. Cómo deshacer un cambio mal hecho

### Si todavía no commiteaste

1. Abrí VS Code
2. Presioná Ctrl + Z varias veces hasta volver al estado anterior
3. Guardá con Ctrl + S

### Si ya commiteaste pero querés volver atrás

    git reset --hard HEAD~1

**Cuidado:** esto borra el último commit y todos sus cambios.

### Si solo querés volver un archivo específico

    git checkout HEAD -- ruta/al/archivo.md

## 9. Problemas comunes

### "El contenido no aparece en el catálogo"

Causas posibles:
- El archivo no está en `src/content/publicaciones/`
- El frontmatter tiene un error de sintaxis (comillas mal cerradas)
- Falta un campo obligatorio
- Guardaste el archivo pero el server no recargó

Solución: revisá la consola del server. Astro muestra el error exacto.

### "El precio se ve mal (COL$ 0)"

Causa: el campo `precioCOP` está vacío o es 0.
Solución: poné un número sin puntos ni comas (ej: 150000).

### "La portada no aparece"

Causa: la ruta en `portada:` no apunta a un archivo real.
Solución: verificá que la imagen está en `public/portadas/` con el
nombre exacto que pusiste en el frontmatter.

### "El sitio se ve roto después de mi cambio"

Solución inmediata:
    git reset --hard HEAD~1

Eso revierte el último commit. Después avisá a un programador.

## 10. Accesibilidad en el contenido

Cada publicación o norma nueva debe cumplir estas reglas. Son
obligatorias (ver `docs/ACCESIBILIDAD.md` para el detalle completo).

### Reglas de oro

1. **Siempre** completar el campo `portadaAlt` con descripción real
   Mal:  "portada"
   Bien: "Portada del libro Contrato de Trabajo Comentado"

2. **Siempre** usar títulos descriptivos
   Mal:  "Introducción"
   Bien: "Introducción al régimen laboral colombiano"

3. **Nunca** usar solo color para indicar algo
   Si querés marcar "urgente", agregá texto o ícono además del color.

4. **Siempre** estructurar el contenido con jerarquía correcta:
   - `#` solo en el título principal (viene del frontmatter)
   - `##` para secciones
   - `###` para subsecciones
   - Nunca saltar niveles

5. **Siempre** describir links con contexto
   Mal:  "Ver más"
   Bien: "Ver Contrato de Trabajo Comentado"

### Verificación antes del commit

- [ ] El campo `portadaAlt` describe la imagen real
- [ ] Los títulos son descriptivos
- [ ] La jerarquía de `##` y `###` no salta niveles
- [ ] Los links tienen texto significativo
- [ ] Corrí Lighthouse y no bajó el score de accesibilidad

## 11. Referencia rápida — rutas

| Qué | Dónde |
|---|---|
| Publicaciones del catálogo | `src/content/publicaciones/` |
| Normas | `src/content/normas/` |
| Portadas | `public/portadas/` |
| Logo y favicon | `public/` |
| Texto de la home | `src/pages/index.astro` |
| Estructura del menú | `src/layouts/LayoutBase.astro` |
| Colores | `tailwind.config.mjs` + `src/styles/global.css` |

## 12. Contacto

Si algo no funciona y no está en esta guía, avisar antes de tocar más.
Un cambio mal hecho es más difícil de arreglar que uno que no se hizo.

## 13. Plantillas

Este proyecto incluye 2 plantillas listas para usar:

- `docs/plantilla-publicacion.md` — Copiar y pegar para crear una
  publicación nueva.
- `docs/plantilla-norma.md` — Copiar y pegar para crear una norma nueva.

También hay un script para automatizar el proceso:

    npm run nueva-publicacion

Ese comando pregunta los datos y crea el archivo `.md` solo.
