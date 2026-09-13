# Sistema de temas

Documentación del sistema claro/oscuro/auto y los tokens semánticos.

## Objetivo

Permitir que el usuario elija entre tres modos:

- Claro — para lectura diurna y entornos iluminados
- Oscuro — para lectura nocturna y bajo consumo de luz
- Auto — sigue la preferencia del sistema operativo

La preferencia se guarda en localStorage y se aplica antes del primer
render para evitar el flash de color (FOUC).

## Tokens semánticos

En lugar de usar colores fijos (bg-slate-900, text-white), el sitio
usa tokens que cambian según el tema activo:

- bg-surface         — fondo principal (blanco en claro, azul oscuro en oscuro)
- bg-surface-muted   — fondo secundario (cards, paneles)
- bg-surface-raised  — fondo elevado (hover de botones, inputs)
- text-content       — texto principal
- text-content-muted — texto secundario
- text-content-subtle— texto deshabilitado o de apoyo
- border-border      — borde estándar
- border-border-strong— borde con más contraste

## Cómo funciona el toggle

El componente `ThemeToggle.astro` ofrece 3 botones: sol, luna, monitor.

- Al hacer click en uno, se guarda el modo elegido en localStorage
- Se aplica la clase `dark` o `sepia` al elemento html
- Se actualiza `data-theme` para que CSS y JS lean el estado

El script anti-FOUC vive en el head de `LayoutBase.astro`, antes de
cualquier otro recurso. Se ejecuta antes del primer paint y evita el
flash blanco cuando el usuario tiene modo oscuro guardado.

## Definición de colores

Los tokens se declaran en `src/styles/global.css` como variables CSS:

- En `:root` se definen los valores del modo claro (default)
- En `.dark` se sobreescriben para el modo oscuro
- En `.sepia` se sobreescriben para el modo sepia

Ejemplo de la variable `--surface`:

- Modo claro: 255 255 255 (blanco)
- Modo oscuro: 15 23 42 (azul muy oscuro, no negro puro)
- Modo sepia: 250 244 227 (crema)

## Paleta de marca

El color primario del sitio es azul cobalto (#0047AB). Se define en
`tailwind.config.mjs` como la paleta `brand`:

- brand-50   #eef4ff
- brand-100  #d9e6ff
- brand-200  #b3cdff
- brand-300  #7da8ff
- brand-400  #4d84ff
- brand-500  #1e5eff
- brand-600  #0047AB  ← color base de botones y links
- brand-700  #003a8c
- brand-800  #002e70
- brand-900  #002354
- brand-950  #001433

Se eligió cobalto en lugar del azul Tailwind por defecto (#2563eb)
porque es más profundo y sobrio, más adecuado para un sitio jurídico.

## Uso en clases

Para fondos y textos:

- bg-brand-600, text-brand-600, border-brand-600
- Hover: hover:bg-brand-500, hover:text-brand-400
- Anillos de foco: focus:ring-brand-600

Para opacidades: bg-brand-600/15, border-brand-600/30, etc.

## Cómo usar los tokens

Regla simple: nunca usar colores fijos en componentes nuevos.

Mal:

    bg-slate-900 text-white
    bg-ink-950 border-ink-800

Bien:

    bg-surface text-content
    bg-surface-muted border-border

Si necesitás un color específico que no está entre los tokens, agregarlo
a global.css como variable CSS en los 3 bloques (root, dark, sepia) y
exponerlo en tailwind.config.mjs.

## Modo de lectura (sepia)

El modo sepia existe para lectura prolongada. Actualmente está definido
en CSS pero no expuesto en el toggle principal, para no confundir al
usuario. Se puede activar en el futuro con un selector específico
dentro de la página de detalle de norma.

## Referencias WCAG

Todos los pares de contraste cumplen WCAG 2.2 AA (4.5:1 mínimo para
texto normal, 3:1 para texto grande y elementos no textuales).

Verificar contraste con:

- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools: inspector → Accessibility → Contrast

## Archivos involucrados

- `tailwind.config.mjs` — definición de la paleta brand y tokens
- `src/styles/global.css` — variables CSS por tema
- `src/components/ThemeToggle.astro` — selector de tema
- `src/layouts/LayoutBase.astro` — script anti-FOUC en el head
