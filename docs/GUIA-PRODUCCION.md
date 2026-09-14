# Guía de producción — LexDigitalHD

Esta guía explica cómo llevar los cambios locales al sitio publicado
en internet.

## 1. Cuándo usar esta guía

Cuando ya:
- Hiciste cambios que funcionan en tu computadora
- Verificaste todo en http://localhost:4321
- Hiciste el commit localmente

Y querés que esos cambios estén **visibles al público**.

## 2. Antes de publicar — checklist

Nunca subas cambios sin haber verificado:

- [ ] El sitio carga sin errores en `http://localhost:4321`
- [ ] Todas las páginas funcionan (home, catálogo, normativa, carrito)
- [ ] Las 4 publicaciones aparecen con sus portadas
- [ ] Los 10 normas aparecen con títulos
- [ ] El carrito funciona (agregar, quitar, vaciar)
- [ ] El cambio de tema (claro/oscuro) funciona
- [ ] Se ve bien en mobile (achicá la ventana del navegador)
- [ ] Corriste Lighthouse y no hay errores rojos de accesibilidad
- [ ] Hiciste commit con `git status` limpio

Si algo falla, **NO publiques**. Arreglalo primero.

## 3. Estado actual del deploy

**IMPORTANTE:** el sitio todavía **no está deployado**.

Esta sección describe el proceso que se va a configurar cuando esté
listo para producción. Actualmente el sitio vive solo en tu computadora.

## 4. Opciones de hosting recomendadas

Todas estas opciones son **gratis** para sitios estáticos:

| Plataforma | Ventaja principal | Cuenta gratuita |
|---|---|---|
| **Netlify** | Deploy automático desde GitHub | Sí |
| **Vercel** | Rápido, buena documentación | Sí |
| **Cloudflare Pages** | Muy rápido, ilimitado | Sí |
| **GitHub Pages** | Integrado con GitHub | Sí |

Recomendación: **Netlify** o **Cloudflare Pages** por su simplicidad.

## 5. Proceso general de deploy (una vez configurado)

El flujo es siempre el mismo:

1. Hacés cambios en tu computadora
2. Verificás en `http://localhost:4321`
3. Hacés commit: `git add -A && git commit -m "..."`
4. Hacés push a GitHub: `git push`
5. La plataforma de hosting detecta el push automáticamente
6. Compila el sitio (`npm run build`)
7. Publica el sitio nuevo
8. En 1-2 minutos, los cambios están en vivo

**Nunca tenés que hacer nada más.** Todo el resto es automático.

## 6. Cómo configurar el deploy (una sola vez)

Cuando estés listo para poner el sitio en internet, avisale a un
programador. Va a hacer estos pasos:

1. Crear cuenta en la plataforma (Netlify, Vercel, etc.)
2. Conectar la cuenta con el repositorio de GitHub
3. Configurar el comando de build: `npm run build`
4. Configurar la carpeta de salida: `dist`
5. Configurar el dominio (ej: `lexdigitalhd.com`)
6. Configurar SSL (HTTPS automático)
7. Verificar que el primer deploy funciona

**No intentes hacer esto sin ayuda.** Un error en la configuración
inicial puede ser difícil de detectar y arreglar.

## 7. Cómo verificar el build antes de publicar

Antes de hacer push, podés probar el build de producción localmente:

**Paso 1** — En la terminal:
    cd /home/donache/LexDigitalHD-web
    npm run build

**Paso 2** — Verificá que no haya errores. Deberías ver algo como:
    ✓ Completed in 12.34s
    dist/
    ├── index.html
    ├── catalogo/
    ├── normativa/
    └── _astro/

**Paso 3** — Probá el build local:
    npm run preview

Eso sirve el build en `http://localhost:4321` como si fuera producción.

**Paso 4** — Verificá que todo funciona igual que en `npm run dev`.

## 8. Problemas comunes en deploy

### "El build falla"

Causa: algún archivo tiene un error de sintaxis.
Solución: corré `npm run build` en local. Astro muestra el error exacto.

### "El sitio se ve bien en local pero mal en producción"

Causa: rutas de archivos con mayúsculas/minúsculas mal.
Solución: verificar que todos los `import` usan la ruta exacta.

### "Las imágenes no cargan"

Causa: las imágenes no están en `public/` (o tienen mayúsculas).
Solución: verificar que estén en `public/portadas/` con nombres exactos.

## 9. Cómo revertir un deploy malo

Si después de publicar el sitio se ve mal:

**Opción A — Revertir el último commit y volver a publicar**

    git revert HEAD
    git push

Eso crea un commit nuevo que deshace el anterior.

**Opción B — Volver a un estado anterior**

    git log --oneline -5    (mirá los hashes de commits anteriores)
    git reset --hard <hash>
    git push --force

**Cuidado:** `push --force` borra commits. Solo usarlo si sabés lo que hacés.

**Opción C — Rollback desde la plataforma**

Netlify, Vercel y Cloudflare guardan el historial de deploys.
Desde su panel, podés "revert to previous deploy" con un click.

## 10. Glosario

| Término | Qué significa |
|---|---|
| **Build** | Compilar el sitio (de `.astro` a HTML/CSS/JS) |
| **Deploy** | Publicar el sitio en internet |
| **Commit** | Guardar cambios en el historial de git |
| **Push** | Enviar commits locales al repositorio remoto (GitHub) |
| **Repositorio** | Carpeta del proyecto rastreada por git |
| **Rama** | Línea de desarrollo (usamos `main`) |
| **HEAD** | El commit actual (el más reciente) |
| **Hash** | Código único de cada commit (ej: `d2b2528`) |

## 11. Referencia rápida de comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca el servidor de desarrollo |
| `npm run build` | Compila el sitio para producción |
| `npm run preview` | Previsualiza el build de producción |
| `git status` | Ver qué cambió desde el último commit |
| `git add -A` | Preparar todos los cambios |
| `git commit -m "..."` | Guardar los cambios |
| `git push` | Subir a GitHub |
| `git log --oneline -5` | Ver los últimos 5 commits |
| `git reset --hard HEAD~1` | Deshacer el último commit |

## 12. Cuándo avisar a un programador

- El build falla y no entendés el error
- Hay que configurar hosting por primera vez
- Hay que integrar un sistema de pago
- Hay que cambiar la estructura del sitio (menú, layouts)
- Hay que tocar el schema de contenido
- Un cambio importante rompió el sitio y no podés revertirlo
