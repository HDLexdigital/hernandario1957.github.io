# LexDigitalHD 2.0 — Roadmap

## Estado de los MVP

| MVP | Título | Estado |
| --- | --- | --- |
| MVP-001 | CIDM 1.0 | ✅ Completado |
| MVP-002 | LEDM 2.0 | ✅ Completado |
| MVP-003 | Semantic Compiler | ✅ Completado |
| MVP-004 | Escalamiento Constitución + EPUB | ✅ Completado |
| MVP-005 | CI/CD + EPUBCheck + axe-core | ✅ Completado |
| MVP-006 | Publicación Web | ✅ Completado |
| MVP-007 | PDF Accesible (PDF/UA) | ✅ Completado |
| MVP-008 | Print-Ready PDF | ✅ Completado |

## MVP-008 — Print-Ready PDF

### Objetivo

Generar PDF apto para imprenta tradicional a partir del mismo LEDM 2.0, mediante CSS Paged Media orientado a producción gráfica.

### Contrato propuesto

`core/print/mvp-008-print-publication.contract.json`

### Reglas clave

- Formato de página (A4, Letter, 6x9, etc.)
- Sangrado (bleed) 3-5 mm
- Marcas de corte (crop, cross)
- Modo de color CMYK
- Perfil ICC (ej. FOGRA39)
- Resolución mínima 300 dpi
- Tipografías incrustadas
- Validación PDF/X (Ghostscript o similar)

### Diferencias con MVP-007

| Aspecto | MVP-007 PDF/UA | MVP-008 Print-Ready |
| --- | --- | --- |
| Color | RGB | CMYK |
| Sangrado | No | Obligatorio |
| Resolución | Pantalla | 300 dpi |
| Estándar | PDF/UA-1 | PDF/X-1a o PDF/X-4 |
| Marcas de corte | No | Sí |
| Objetivo | Accesibilidad | Imprenta |

### Herramientas previstas

- **WeasyPrint** para generación base con CSS Paged Media.
- **Ghostscript** para validación y conversión de perfil de color.
- **pdfinfo / pdfcpu** para verificación de metadatos.

### Estado

Planificado, no iniciado.

## Estrategia de continuidad

1. Cerrar MVP-007 con evidencia `veraPDF` verde.
2. Consolidar el renderer PDF accesible.
3. Abrir MVP-008 reutilizando la misma arquitectura, solo cambiando la capa de CSS y las validaciones.

## MVP-009 — Design System Base (Propuesta)

### Objetivo

Incorporar una hoja de estilo predefinida como base o plantilla común para afectar la presentación de HTML, EPUB y PDF, manteniendo la separación entre contenido semántico (LEDM) y presentación visual.

### Estado

📋 Propuesto, no iniciado.

### Ubicación prevista

```text
core/styles/
├── tokens.json        # colores, fuentes, tamaños, espaciados
├── base.css           # hoja base editorial
├── web.css            # variante para pantalla
├── epub.css           # variante para EPUB
├── print.css          # variante para PDF/imprenta
└── PagedMedia.css     # reglas @page, folios, sangrías


| MVP-009 | Design System Base | ✅ 1.0.0 congelado |
| MVP-010 | Publicación y Distribución Web Automática | ✅ Completado |
