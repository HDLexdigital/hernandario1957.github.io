# Contrato C01-04: Proyección Semántica XHTML/EPUB

## 1. Propósito y Alcance
Este contrato define la capa de abstracción entre la clasificación documental originada en InDesign y la proyección estructural final en XHTML/EPUB (WCAG 2.2 / PDF/UA). Su objetivo es garantizar que la semántica de publicación sea explícita, determinista y auditable, separando la presentación visual de las afirmaciones jurídicas y de accesibilidad.

## 2. Invariantes Arquitectónicos (Reglas de Negocio)

* **SEM-01:** El constructor XHTML no puede inferir estados jurídicos.
* **SEM-02:** El constructor XHTML no puede inventar evidencia documental.
* **SEM-03:** ARIA y los roles de accesibilidad deben proceder de una clasificación semántica contractual externa, nunca de lógica embebida en el renderizador.
* **SEM-04:** La semántica jurídica no puede depender exclusivamente del nombre visual de un estilo de InDesign.
* **SEM-05:** El atributo `lang` debe proceder del contrato documental o del perfil editorial, no de una inferencia arbitraria.
* **SEM-06:** `aria-hidden="true"` sólo puede aplicarse a contenido explícitamente clasificado en el contrato como no informativo para accesibilidad (ej. elementos puramente decorativos).
* **SEM-07:** La salida XHTML debe ser absolutamente determinista para una misma entrada.
* **SEM-08:** El proceso de *pretty-print* (formateo de salida) es estrictamente posterior a la construcción y no puede modificar el árbol semántico bajo ninguna circunstancia.
* **SEM-09:** Una modificación visual en el origen (InDesign) no puede cambiar silenciosamente una afirmación jurídica en la salida.
* **SEM-10:** Toda transformación semántica debe ser trazable al elemento exacto de entrada que la originó.

## 3. Matriz de Proyección Semántica Base

La siguiente matriz establece el mapeo autorizado entre la clasificación de entrada y los atributos estructurales y de accesibilidad requeridos para la salida.

| Clasificación de Entrada | Semántica Declarada | XHTML Target | ARIA / EPUB Type | Atributo `lang` | Origen de Evidencia |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `P01_TITLE` | título | `h1` | — | `es-CO` | AST |
| `P02_CHAPTER` | capítulo | `section` | `doc-chapter` | `es-CO` | AST |
| `P03_ARTICLE` | artículo | `section` | `doc-section` | `es-CO` | AST |
| `P04_BODY` | cuerpo | `p` | — | `es-CO` | AST |
| `[Elemento Decorativo]` | decorativo | [Elemento Original] | `aria-hidden="true"` | — | Clasificación Explícita |

## 4. Implementación Futura (Mapeo a Código)
Para garantizar el cumplimiento de este contrato, la matriz anterior se traducirá a un archivo JSON (ej. `config/semantic-accessibility.json`) que será consumido por el validador Zod. El `constructorXHTML.js` actuará **únicamente** como una función pura que proyecta las propiedades inyectadas por este contrato.
