# Solución de problemas — LexDigitalHD

Esta guía te ayuda cuando algo no funciona. Buscá tu problema en la
lista y seguí los pasos.

## 1. Regla número uno

Si algo se rompió y no sabés por qué, **NO sigas tocando archivos**.
Primero intentá revertir:

    git reset --hard HEAD~1

Eso deshace el último commit. Después avisá a un programador.

## 2. El sitio no carga en el navegador

### Síntoma: la página dice "No se puede acceder al sitio"

**Causa probable:** el servidor de desarrollo no está corriendo.

**Solución:**
1. Abrí una terminal
2. Corré: `cd /home/donache/LexDigitalHD-web && npm run dev`
3. Esperá a ver: `🚀 astro v4.16.19 ready`
4. Recargá el navegador

### Síntoma: la página carga pero se ve rota

**Causa probable:** error en algún archivo `.astro`.

**Solución:**
1. Mirá la terminal donde corre `npm run dev`
2. Buscá líneas con `[ERROR]` en rojo
3. Si menciona un archivo específico, abrilo y buscá el error
4. Si no entendés el error, avisá a un programador

### Síntoma: la página da error 500

**Causa probable:** error en el layout o en un componente.

**Solución:**
1. Corré `git status` para ver qué cambió
2. Corré `git diff` para ver el cambio exacto
3. Si el cambio es tuyo y no sabés arreglarlo: `git reset --hard HEAD~1`

## 3. El contenido nuevo no aparece

### Síntoma: agregué una publicación pero no la veo en el catálogo

**Checklist:**

1. ¿El archivo está en la carpeta correcta?
   Debe estar en: `src/content/publicaciones/`

2. ¿El archivo termina en `.md`?
   Ejemplo correcto: `mi-libro.md`
   Ejemplo incorrecto: `mi-libro.txt`, `mi-libro`

3. ¿El frontmatter está bien formado?
   Debe empezar con `---` en la línea 1
   Debe cerrar con `---` antes del contenido
   Ejemplo:
       ---
       sku: "LDH-001"
       titulo: "Mi Libro"
       ---

4. ¿Están los campos obligatorios?
   Como mínimo: `sku`, `titulo`, `autores`, `materia`, `tipoAcceso`,
   `formatos`, `portada`, `portadaAlt`, `fechaPublicacion`, `resumenCorto`

5. ¿Guardaste con Ctrl + S?
   Si no guardás, el cambio no existe.

**Solución:** revisá la terminal del server. Astro muestra el error exacto
con nombre de archivo y campo problemático.

### Síntoma: Astro dice "frontmatter does not match schema"

**Causa:** algún campo tiene el tipo incorrecto.

**Ejemplos comunes:**
- `precioCOP: "150000"` (con comillas, es texto) → debe ser `precioCOP: 150000`
- `edicion: "1"` → debe ser `edicion: 1`
- `fechaPublicacion: 20/01/2026` → debe ser `fechaPublicacion: 2026-01-20`
- `autores: "Juan"` → debe ser una lista:
      autores:
        - "Juan"

**Solución:** revisá el campo que Astro menciona y corregí el formato.

### Síntoma: "contains a mix of content and data entries"

**Causa:** hay archivos `.md` y `.json` mezclados en la misma carpeta
de una colección.

**Solución:** mover los `.json` a `src/data/` o a otra colección.
Ver `docs/ARQUITECTURA.md` para el detalle de cada colección.

## 4. Problemas con Git

### Síntoma: "fatal: not a git repository"

**Causa:** estás en la carpeta equivocada.

**Solución:**
    cd /home/donache/LexDigitalHD-web
    git status

Si sigue fallando, avisá a un programador.

### Síntoma: "nothing to commit, working tree clean"

**Causa:** no hay cambios pendientes. Todo está guardado.

**Solución:** no es un error, es normal. Podés seguir trabajando.

### Síntoma: "Please tell me who you are"

**Causa:** Git no tiene configurado tu nombre/email.

**Solución:**
    git config user.name "Tu Nombre"
    git config user.email "tu@email.com"

Solo hay que hacerlo una vez.

### Síntoma: conflicto de merge

**Causa:** dos personas tocaron el mismo archivo.

**Solución:** avisar a un programador. Los conflictos son delicados.

## 5. Problemas con la terminal

### Síntoma: el prompt queda en ">" y no vuelve

**Causa:** quedó un heredoc abierto (falta un `EOF`).

**Solución:** apretá Ctrl + C. Eso cancela el comando actual.

### Síntoma: "Orden no encontrada"

**Causa:** escribiste mal un comando o pegaste contenido en la terminal
que no era un comando.

**Solución:** revisá el comando. Si pegaste texto de un archivo,
por error, mejor pegarlo en VS Code, no en la terminal.

### Síntoma: la terminal se ve con colores raros

**Causa:** algún comando dejó un estado raro.

**Solución:** cerrá la terminal y abrí una nueva.

## 6. Problemas con dependencias (npm)

### Síntoma: "Cannot find module 'X'"

**Causa:** falta instalar dependencias.

**Solución:**
    cd /home/donache/LexDigitalHD-web
    npm install

### Síntoma: la terminal muestra warnings de npm

**Causa:** puede ser normal.

**Solución:** ignorar warnings de "deprecated" o "vulnerabilities",
salvo que el build falle.

## 7. Problemas visuales

### Síntoma: los colores no se ven bien

**Causa:** puede ser caché del navegador.

**Solución:**
1. Recargá con Ctrl + Shift + R
2. Si no funciona, abrí en ventana incógnita:
   - Chrome: Ctrl + Shift + N
   - Firefox: Ctrl + Shift + P
3. Si en incógnito se ve bien, borrá caché: Ctrl + Shift + Supr

### Síntoma: el modo oscuro no cambia

**Causa:** el navegador guardó la preferencia anterior.

**Solución:**
1. Abrí la consola del navegador (F12)
2. Escribí: `localStorage.removeItem('theme')`
3. Recargá con Ctrl + Shift + R

### Síntoma: las cards no se ven con el color correcto

**Causa:** Tailwind no regeneró el CSS.

**Solución:**
1. Parar el server con Ctrl + C
2. Correr de nuevo: `npm run dev`
3. Recargar con Ctrl + Shift + R

### Síntoma: las imágenes no cargan

**Causa:** la ruta está mal o el archivo no está donde debe.

**Solución:**
1. Verificá que la imagen esté en `public/portadas/`
2. Verificá que el nombre en el `.md` coincida EXACTAMENTE
   (mayúsculas, guiones, extensión)
3. Recargá con Ctrl + Shift + R

## 8. Problemas de accesibilidad

### Síntoma: Lighthouse marca errores rojos

**Causa:** elementos sin alt, sin labels, o contraste bajo.

**Solución:**
1. Leé el detalle que da Lighthouse (dice exactamente qué elemento)
2. Si es una imagen nueva: agregale `portadaAlt` en el frontmatter
3. Si es un link: cambiá el texto por uno más descriptivo
4. Ver `docs/ACCESIBILIDAD.md` para las reglas completas

### Síntoma: el sitio no se puede navegar con Tab

**Causa:** algún elemento interactivo perdió el foco.

**Solución:** avisar a un programador. Es un problema serio.

## 9. Cuándo avisar a un programador

Avisar **siempre** en estos casos:

- El sitio no carga y no es por el server apagado
- El build falla con un error que no entendés
- Un cambio rompió el sitio y no podés revertirlo con git
- Hay que integrar algo nuevo (pago, mail, API)
- Hay que cambiar la estructura (menú, layouts, componentes)
- Hay que modificar el schema de contenido
- Hay conflictos de git

## 10. Cómo reportar un problema

Si tenés que avisar a un programador, incluí:

1. **Qué estabas haciendo** (ej: "agregando una publicación nueva")
2. **Qué esperabas** (ej: "verla en el catálogo")
3. **Qué pasó** (ej: "el catálogo quedó vacío")
4. **Mensaje de error** (copiá y pegá el texto exacto)
5. **Qué archivo tocaste** (ej: `src/content/publicaciones/mi-libro.md`)
6. **Los últimos comandos que corriste**

Con esa info, cualquier programador puede resolverlo rápido.
