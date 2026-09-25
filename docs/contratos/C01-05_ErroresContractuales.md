# Contrato C01-05: Taxonomía y Estructura de Errores Contractuales
**Versión:** 1.0.0-draft

## 1. Propósito y Alcance
Este contrato rige el comportamiento del sistema ante estados ilegales o violaciones de contratos documentales. Define la taxonomía cerrada de fallos, prohibiendo el uso de excepciones genéricas (`throw new Error()`) en la Capa Anticorrupción (ACL) y los validadores.

## 2. Invariantes (Reglas de Negocio)
* **ERR-INV-01 (Estructura Obligatoria):** Todo error contractual debe ser un objeto serializable (JSON) que incluya: código de error, ID del contrato vulnerado, versión del contrato, mensaje descriptivo, detalles (ej. el `styleName` causante) y marca de tiempo ISO.
* **ERR-INV-02 (Cero Fallbacks):** Un error contractual implica aborto inmediato de la compilación (Strict Fail). No existen advertencias silenciosas ni resoluciones por defecto.
* **ERR-INV-03 (Trazabilidad):** Los errores deben proveer contexto suficiente para la auditoría posterior sin depender de la traza de ejecución nativa (stack trace).

## 3. Taxonomía de Errores Contractuales

| Código | Detalle Requerido | Condición de Disparo |
| :--- | :--- | :--- |
| `ERR-001_STYLE_NOT_REGISTERED` | `styleName` | El estilo de InDesign no existe en el mapa de accesibilidad. |
| `ERR-002_TOKEN_CONTRACT_INVALID` | `zodError` | El token crudo viola el esquema de la Unión Discriminada. |
| `ERR-003_OUTPUT_PROFILE_INVALID` | `perfil` | El perfil de proyección solicitado no es WEB ni EPUB. |
| `ERR-004_CONTRACT_VERSION_MISMATCH` | `expected`, `received` | Desajuste entre la versión del JSON y el validador Zod. |
