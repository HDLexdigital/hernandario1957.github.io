# MVP-008 — Print-Ready PDF
## Requisitos previos para la redacción del contrato

> Documento de referencia obligatorio para elaborar
> `core/print/mvp-008-print-publication.contract.json`.

## 1. PDF de referencia complejo

Se debe disponer de un **PDF de referencia rico**, idealmente generado una
sola vez desde Adobe InDesign, que cubra al menos:

- Portada e índice
- Artículos largos y cortos
- Títulos de distinto nivel jerárquico
- Notas al pie
- Listas numeradas y con viñetas
- Referencias cruzadas
- Tablas o cuadros comparativos
- Anexos con formato propio

Este PDF servirá como fuente de evidencia para extraer reglas de composición.

## 2. Extracción de propiedades de composición

Se analizará el PDF de referencia únicamente con herramientas Linux:

- `pdffonts` → fuentes y empotramiento
- `pdfinfo` → metadatos, tamaño de página, versión PDF
- `pdftotext` → orden de lectura y jerarquía
- `pdfimages -list` → resolución de imágenes

## 3. Traducción a CSS/JSON

Las reglas visuales extraídas se traducirán a:

- `font-family`, `font-size`, `line-height`
- `margin`, `padding`, `text-indent`
- `color`, `background-color`
- `@page { size, bleed, marks }`
- contadores CSS para numeración

Y se almacenarán en:

cd ~/proyecto-lexdigital
cat >> docs/MVP008_CONTRACT_REQUIREMENTS.md << 'EOF'

## 8. Objetivo formal de MVP-008

MVP-008 — Print-Ready PDF será la base para generar **PDFs de alta calidad
técnica destinados a publicaciones jurídicas y libros de texto corrido**.

Se considerará un resultado aceptable si el PDF generado:

- conserva la fidelidad textual y estructural del LEDM;
- aplica reglas de composición editorial profesional;
- controla paginación, márgenes, sangrías, cabeceras, folios y numeración;
- permite tamaños de página flexibles;
- es reproducible mediante `npm run ci:pdf` o comando equivalente;
- no depende de Adobe InDesign en producción.

El objetivo no es replicar milimétricamente un diseño manual de InDesign,
sino ofrecer un control automatizado, verificable y de alto nivel para
texto corrido jurídico y editorial.
EOF
core/print/mvp-008-print-publication.contract.json

## 9. Nota sobre economía temporal

La restricción de coste monetario no es permanente.  
Por ello, el motor definitivo de MVP-008 se evaluará en la fase de implementación.

Rutas previstas:

- **Ruta base:** WeasyPrint + Ghostscript (coste 0, suficiente para flujos editoriales).
- **Ruta premium:** Prince (coste comercial, PDF/X nativo, tipografía superior).

El contrato permanece agnóstico al motor y fija requisitos de salida, no herramientas obligatorias.
## 9. Nota sobre economía temporal

La restricción de coste monetario no es permanente.  
Por ello, el motor definitivo de MVP-008 se evaluará en la fase de implementación.

Rutas previstas:

- **Ruta base:** WeasyPrint + Ghostscript (coste 0, suficiente para flujos editoriales).
- **Ruta premium:** Prince (coste comercial, PDF/X nativo, tipografía superior).

El contrato permanece agnóstico al motor y fija requisitos de salida, no herramientas obligatorias.

## 9. Nota sobre economía temporal

La restricción de coste monetario no es permanente.  
Por ello, el motor definitivo de MVP-008 se evaluará en la fase de implementación.

Rutas previstas:

- **Ruta base:** WeasyPrint + Ghostscript (coste 0, suficiente para flujos editoriales).
- **Ruta premium:** Prince (coste comercial, PDF/X nativo, tipografía superior).

El contrato permanece agnóstico al motor y fija requisitos de salida, no herramientas obligatorias.
