# Accesibilidad — Estándar obligatorio

Este documento define las **premisas de accesibilidad que TODO cambio,
publicación nueva o funcionalidad agregada debe cumplir** antes de
subir a producción.

No es una recomendación: es un requisito.

## 1. Alcance

Aplica a:
- Cada publicación nueva que se agregue al catálogo
- Cada norma nueva que se agregue a la colección
- Cada componente o página que se cree
- Cada cambio visual (colores, tipografía, espaciado)
- Cada funcionalidad interactiva (formularios, filtros, carrito)

No aplica a:
- Documentos históricos importados (aunque se recomienda corregirlos)
- Contenido de terceros no editable

## 2. Marco legal

El sitio opera en Colombia. Las normas aplicables son:

- **Ley 1618 de 2013** — Garantiza el acceso a las TIC para personas
  con discapacidad. Obliga a sitios web de servicios públicos y privados
  a cumplir estándares internacionales de accesibilidad.
- **Resolución 1519 de 2020** — Adopta la norma WCAG 2.1 nivel AA como
  estándar obligatorio para sitios web en Colombia.
- **Ley 1712 de 2014** — Transparencia y acceso a la información pública.
- **Ley 2434 de 2024** — Actualización del marco de inclusión digital.

El incumplimiento puede dar lugar a acciones de tutela.

## 3. Estándar técnico

El sitio se compromete a cumplir **WCAG 2.2 nivel AA** como mínimo.

Las siglas WCAG significan Web Content Accessibility Guidelines.
Los niveles son A (básico), AA (intermedio), AAA (avanzado).

El nivel AA es el que exige la ley colombiana.

## 4. Reglas de estructura y semántica

### 4.1 Jerarquía de headings

- **Un solo `<h1>` por página** (el título principal)
- **Nunca saltar niveles** (h1 → h2 → h3, nunca h1 → h3)
- Los headings describen el contenido, no su apariencia

Mal:
    <h1>Título</h1>
    <h3>Subtítulo</h3>   (salta h2)

Bien:
    <h1>Título</h1>
    <h2>Subtítulo</h2>
    <h3>Sub-subtítulo</h3>

### 4.2 Landmarks HTML

Cada página debe tener:
- `<header>` — cabecera
- `<nav>` — navegación (puede haber más de uno con aria-label distinto)
- `<main>` — contenido principal (uno solo)
- `<footer>` — pie

### 4.3 Estructura semántica

- Usar `<article>` para contenido autocontenido (una norma, una card)
- Usar `<section>` para agrupar contenido con título
- Usar `<button>` para acciones y `<a>` para navegación (no al revés)
- Usar `<time datetime="...">` para fechas

## 5. Reglas de contenido

### 5.1 Imágenes

- Toda imagen con contenido informativo **debe tener `alt` descriptivo**
- Toda imagen decorativa **debe tener `alt=""`** (vacío) y `aria-hidden="true"`
- **Nunca** usar alt genéricos: "imagen", "foto", "logo", "icono"
- El alt describe **qué se ve** y **para qué sirve**

Mal:
    <img src="portada.webp" alt="imagen" />
    <img src="portada.webp" alt="portada" />

Bien:
    <img src="portada.webp" alt="Portada del libro Contrato de Trabajo Comentado" />
    <img src="icono.svg" alt="" aria-hidden="true" />

### 5.2 Links

- El texto de un link debe ser descriptivo fuera de contexto
- **Nunca** usar: "click aquí", "leer más", "ver", "más info"
- Si el diseño obliga a un link corto, agregar `aria-label` con contexto

Mal:
    <a href="/normativa/ley-1">Ver más</a>

Bien:
    <a href="/normativa/ley-1">Ver Ley 1 de 2026</a>
    <a href="/normativa/ley-1">Ver más <span class="sr-only">sobre Ley 1 de 2026</span></a>

### 5.3 Botones

- Todo `<button>` debe tener texto visible **o** `aria-label`
- Los botones con solo ícono **requieren `aria-label`**
- Los botones con estado activo usan `aria-pressed`

## 6. Reglas de formularios

- Cada `<input>` debe tener un `<label>` asociado con `for`/`id`
- El `placeholder` **no reemplaza** al label (desaparece al escribir)
- Los errores se anuncian con `aria-live="polite"`
- Los campos obligatorios se marcan con `aria-required="true"`
- El foco siempre debe ser visible (ring de color)

Mal:
    <input type="search" placeholder="Buscar" />

Bien:
    <label for="buscar" class="sr-only">Buscar normas</label>
    <input id="buscar" type="search" placeholder="Buscar normas..." />

## 7. Reglas de interacción

### 7.1 Teclado

Todo el sitio debe ser usable **solo con teclado**:

- Tab: navega hacia adelante
- Shift+Tab: navega hacia atrás
- Enter: activa links y botones
- Space: activa botones y checkboxes
- Escape: cierra modales y menús

**Nunca** dejar un elemento clickeable que no sea alcanzable con Tab.

### 7.2 Foco visible

Todo elemento interactivo debe mostrar un anillo de foco visible:

    focus:outline-none focus:ring-2 focus:ring-brand-600

Nunca usar `outline: none` sin reemplazo.

### 7.3 Touch targets

En mobile, todo botón o link debe medir **al menos 44 × 44 px**.

## 8. Reglas de contraste

### 8.1 Ratios mínimos

| Elemento | Ratio mínimo |
|---|---|
| Texto normal (< 24px) | 4.5:1 (AA) |
| Texto grande (≥ 24px o ≥ 18.6px negrita) | 3:1 (AA) |
| Componentes de UI (bordes, iconos) | 3:1 |
| Estados de foco | 3:1 |

### 8.2 Cómo verificar

- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools → Inspector → Accessibility → Contrast

### 8.3 Reglas adicionales

- **Nunca** depender solo del color para comunicar información
  (ej: no usar solo rojo para "error" — agregar ícono o texto)
- **Nunca** usar blanco puro (#FFF) sobre negro puro (#000)
  (causa halos en algunos usuarios)

## 9. Reglas de movimiento

- Respetar `prefers-reduced-motion`
- Las animaciones son cortas (< 400ms)
- No hay movimiento automático ni carruseles autoplay
- Los cambios de estado se anuncian con `aria-live` cuando corresponde

## 10. Lectores de pantalla

- Los cambios dinámicos se anuncian con `aria-live="polite"`
- Los contenidos decorativos tienen `aria-hidden="true"`
- Los formularios tienen labels asociados
- Los íconos con función tienen `aria-label`

## 11. Checklist antes de cada commit

Antes de subir cualquier cambio a git, verificar:

- [ ] Un solo `<h1>` por página
- [ ] Jerarquía de headings sin saltos (h1 → h2 → h3)
- [ ] Todas las imágenes tienen `alt` descriptivo o `alt=""` + aria-hidden
- [ ] Todos los inputs tienen `<label>` asociado
- [ ] Todos los botones con solo ícono tienen `aria-label`
- [ ] Los links tienen texto significativo
- [ ] Los ratios de contraste cumplen (4.5:1 texto normal)
- [ ] El sitio se puede navegar con Tab
- [ ] El foco es visible en todos los interactivos
- [ ] Los cambios dinámicos se anuncian con aria-live
- [ ] El contenido se ve bien a zoom 200%
- [ ] Funciona en mobile (touch targets ≥ 44px)

## 12. Herramientas de verificación

### Automáticas

- **Lighthouse** (Chrome DevTools → Lighthouse → Accessibility)
- **axe DevTools** (extensión de navegador)
- **WAVE** (extensión de navegador)
- **Pa11y** (línea de comandos)

### Manuales

- **Navegación por teclado**: desconectar mouse, usar Tab + Enter
- **Zoom 200%**: Ctrl + + en el navegador
- **Lector de pantalla**: Orca (Linux), NVDA (Windows), VoiceOver (macOS)

## 13. Estado actual del sitio

Auditoría realizada: (pendiente de completar)

### Cumplido

- Skip link en LayoutBase
- Estructura semántica (header/nav/main/footer)
- ARIA labels en botones con íconos
- focus:ring-2 en interactivos
- Contraste WCAG AA en textos principales
- aria-live en controles de lectura
- aria-current="page" en nav activo

### Pendiente de auditar

- Jerarquía de headings en todas las páginas
- Alt de imágenes (portadas, logos)
- Labels de formularios (buscadores)
- Navegación completa por teclado
- Comportamiento con zoom 200%
- Prueba con lector de pantalla real

## 14. Cómo agregar contenido accesible

Cuando agregues una publicación o norma nueva:

1. Completar el campo `portadaAlt` con descripción real de la imagen
2. Usar títulos descriptivos (no genéricos)
3. En el cuerpo del markdown, usar jerarquía correcta de `##` y `###`
4. Si incluís imágenes en el contenido, agregar alt
5. Verificar que el texto nuevo cumpla contraste
6. Correr Lighthouse antes del commit
