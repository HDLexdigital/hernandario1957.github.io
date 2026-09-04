cd ~/proyecto-lexdigital

# 1. Crear documento de taxonomía semántica
cat > core/styles/SEMANTIC_TAXONOMY.md << 'EOF'
# 🏛️ Taxonomía Semántica de Estilos — LexDigitalHD

**Módulo:** `core/styles`
**Versión:** 1.0.0
**Alineación:** LEDM 2.0 / WCAG 2.1 AA / PDF/UA-1 / PDF/X-1a

---

## 1. Convención de Nombres y Tokens (`--ld-*`)

Todos los tokens de diseño expuestos a la cascada CSS deben estar prefijados con `--ld-` para evitar colisiones con librerías externas o estilos de agentes de usuario.

### Estructura de Propiedades Custom

- `--ld-color-text-primary`
- `--ld-color-bg-primary`
- `--ld-color-accent`
- `--ld-color-muted`
- `--ld-color-border`
- `--ld-font-family-body`
- `--ld-font-family-heading`
- `--ld-font-family-mono`
- `--ld-font-size-base`
- `--ld-font-size-h1` a `--ld-font-size-h6`
- `--ld-line-height-base`
- `--ld-line-height-heading`
- `--ld-spacing-unit`
- `--ld-spacing-paragraph-gap`
- `--ld-spacing-section-margin`

---

## 2. Correspondencia Canónica: Rol LEDM ➔ Clase CSS

El sistema prohíbe clases basadas en presentación visual. Toda clase CSS debe expresar el **rol estructural o jurídico** definido en el nodo LEDM.

| Rol LEDM 2.0 | Clase CSS Canónica | Elemento HTML/XHTML | Rol ARIA / DPUB | Regla Editorial Clave |
| :--- | :--- | :---: | :---: | :--- |
| `norma` | `.ld-norma` | `<main>` / `<article>` | `role="article"` | Contenedor raíz del cuerpo normativo |
| `libro` | `.ld-nivel-libro` | `<section>` | `role="doc-part"` | Salto de página forzado en print |
| `titulo` | `.ld-nivel-titulo` | `<section>` | `role="doc-chapter"` | `break-before: page` (opcional en print) |
| `capitulo` | `.ld-nivel-capitulo` | `<section>` | `role="region"` | `break-after: avoid` en su encabezado |
| `articulo` | `.ld-articulo` | `<article>` | `role="article"` | `margin-bottom: --ld-spacing-section-margin` |
| `epigrafe` | `.ld-epigrafe` | `<header>` | `role="doc-subtitle"` | Tipografía cursiva/muted ligada al artículo |
| `encabezado-articulo` | `.ld-articulo-header` | `<h3>` – `<h6>` | `role="heading"` | `break-after: avoid` obligatorio |
| `cuerpo-articulo` | `.ld-articulo-cuerpo` | `<p>` | N/A | `text-align: justify; hyphens: auto;` |
| `paragrafo` | `.ld-paragrafo` | `<div>` / `<p>` | N/A | Sangría izquierda 1rem, fuente 0.95x |
| `numeral` | `.ld-numeral` | `<li>` / `<p>` | N/A | Lista ordenada o bloque sangrado |
| `literal` | `.ld-literal` | `<li>` / `<p>` | N/A | Lista anidada alfabética |
| `nota-al-pie` | `.ld-footnote` | `<aside>` | `role="doc-footnote"` | Tamaño `small`, separación de borde superior |
| `referencia-nota` | `.ld-footnote-ref` | `<a>` / `<sup>` | `role="doc-noteref"` | Vínculo bidireccional accesible |

---

## 3. Prohibiciones Explícitas en Hojas de Estilo

1. **Prohibición de Clases Cosméticas:**
   - Quedan terminantemente prohibidas clases como `.red-text`, `.bold-12`, `.padding-top-20`, `.col-derecha`.

2. **Prohibición de Selectores de Tag Puros sin Contexto:**
   - No se permite aplicar reglas destructivas globales como `p { margin: 0; }` o `div { ... }` que anulen la semántica natural de los agentes de usuario accesibles.

3. **Prohibición de Sobrescritura de Identidad Semántica:**
   - Un perfil de salida puede ajustar el color o el tamaño (`font-size`, `margin`), pero **jamás** alterar la visualización de un bloque de forma que oculte su jerarquía (ej. ocultar un `h3` o forzarlo como texto plano).

4. **Prohibición de Estilos en Línea:**
   - La presencia de atributos `style="..."` en el HTML/XHTML compilado causará falla inmediata en la validación CI.

---

## 4. Invariantes de Accesibilidad Digital y Preprensa

- **Legibilidad Asistida:** Todo contenedor de nivel normativo debe vincularse a su encabezado mediante `aria-labelledby="[nodeId]"`.
- **Huérfanas y Viudas:** La clase base para párrafos de texto continuo (`.ld-articulo-cuerpo`) debe forzar:
  ```css
  orphans: 2;
  widows: 2;
