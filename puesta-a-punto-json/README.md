# Puesta a Punto de Archivos JSON

Carpeta consolidada para corregir defectos de documentos JSON antes del procesamiento.

## Contenido

- `diccionario-defectos.json`: catálogo de defectos, causas y soluciones.
- `reporte-defectos.json`: defectos detectados en la última ejecución.
- `reporte-soluciones-avanzado.json`: correcciones detalladas con código exacto.

## Flujo recomendado

1. Ejecutar suite de pruebas estresantes.
2. Consultar reporte de defectos.
3. Para cada archivo rechazado, revisar `reporte-soluciones-avanzado.json`.
4. Aplicar la corrección indicada en el JSON original.
5. Repetir validación.
