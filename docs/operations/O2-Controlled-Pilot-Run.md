# O2 — First Controlled Pilot Run
**Estado:** 🟢 CERTIFIED / FROZEN  
**Baseline:** LexDigitalHD Production Certification Baseline (E18–E26)  

---

## 1. Propósito y Alcance

La fase **O2** representa la transición de las primitivas aisladas (O1) hacia la ejecución de una **unidad operacional real completa**. Su objetivo es demostrar que el sistema es capaz de procesar un corpus jurídico real consumiendo el baseline congelado sin modificar una sola línea de código de E18–E26, produciendo evidencia soberana de punta a punta.

---

## 2. El Corpus Piloto Hostil (`hostilePilotCorpus.json`)

Para probar la robustez del pipeline, O2 no utiliza un corpus complaciente, sino una estructura deliberadamente hostil que incluye:
* Títulos y artículos normativos complejos.
* Numerales y literales anidados.
* Estilos de párrafo y de carácter personalizados.
* Restricciones de salto entre `TextFrames` y control de *overset*.

---

## 3. Invariantes del Piloto (P1–P8)

* **P1 (Controlled Input):** Todo piloto acepta exclusivamente un corpus con identificador explícito y su respectivo `inputHash` inmutable.
* **P2 (Identity Continuity):** La cadena `jobIdentity ➔ executionId ➔ sessionId ➔ commandId` permanece idéntica e inalterada durante toda la corrida.
* **P3 (Baseline Integrity):** Se verifica obligatoriamente que los contratos E18–E26 correspondan al baseline certificado antes de iniciar.
* **P4 (End-to-End Evidence):** Se genera evidencia continua desde el AST hasta el certificado E26.7 (`ProductionCorpusCertificate`).
* **P5 (Evidence Persistence):** Toda evidencia operacional se persiste exclusivamente a través de O1.1, prohibiendo archivos temporales huérfanos.
* **P6 (Failure Containment):** Cualquier fallo frontera deriva en estados terminales explícitos (`FAILED`, `QUARANTINED`), bloqueando falsos positivos.
* **P7 (Terminal Certification Binding):** El resultado se vincula de forma unívoca a su certificado terminal.
* **P8 (Pilot Reproducibility):** Las ejecuciones repetidas sobre el mismo corpus y baseline permiten una comparación limpia sin contaminar el `executionId`.

---

## 4. Máquina de Estados Operacional

Las transiciones de estado son estrictas y explícitas:
```text
CREATED ──► VALIDATED ──► RUNNING ──► [ FAILED ──► QUARANTINED ]
                                  └──► CERTIFIED ──► RELEASE_AUTHORIZED ──► PRODUCTION