# GLOBAL-SYSTEMIC-BASELINE-001

## Contract Registry

**LexDigitalHD — E18–E26 + O1–O6**

**Estado:** `FROZEN`  
**Clasificación:** Normative Contract Registry  
**Modo:** `READ-ONLY` · `AUDITABLE` · `REPRODUCIBLE` · `APPEND-ONLY`

---

## 1. Propósito

El presente documento constituye el **Registro Oficial de Contratos e Invariantes** del `GLOBAL-SYSTEMIC-BASELINE-001`. 

Su función es establecer la correspondencia normativa, verificable y exacta entre los componentes de gobernanza transversal (`O6.1` a `O6.6`), sus motores de ejecución en código fuente, las suites de pruebas de desarrollo guiado por contratos (TDD) y los códigos de error normativos emitidos ante cualquier violación.

Ningún invariante registrado en este documento puede ser modificado, relajado o eliminado sin someterse al Protocolo de Cambio de Baseline y superar la regresión global completa.

---

## 2. Resumen General del Registro

El bloque O6 se compone de seis motores transversales de solo lectura que auditan las capas de producción y preservación (`O1–O5`), garantizando que la historia institucional cumpla con estrictos criterios de identidad, criptografía, estados, topología de grafos, propagación de fallos y gobernanza sistémica.

| Dominio | Rango | Motor Responsable (`src/operations/O6/`) | Contrato TDD (`test/operations/O6/`) | Estado |
|---|---|---|---|---|
| **Identity Integrity** | `I1–I12` | `CrossLayerIdentityIntegrityEngine.js` | `CrossLayerIdentityIntegrityContract.test.js` | `CERTIFIED` |
| **Hash Lineage** | `H1–H12` | `EndToEndHashLineageEngine.js` | `EndToEndHashLineageContract.test.js` | `CERTIFIED` |
| **State Consistency** | `S1–S12` | `LifecycleStateConsistencyEngine.js` | `LifecycleStateConsistencyContract.test.js` | `CERTIFIED` |
| **Evidence Graph** | `G1–G12` | `EvidenceGraphConsistencyEngine.js` | `EvidenceGraphConsistencyContract.test.js` | `CERTIFIED` |
| **Failure Propagation** | `F1–F12` | `CrossLayerFailurePropagationEngine.js` | `CrossLayerFailurePropagationContract.test.js` | `CERTIFIED` |
| **Systemic Governance** | `SC1–SC12` | `SystemicCertificationGovernanceEngine.js` | `SystemicCertificationGovernanceContract.test.js` | `CERTIFIED` |

---

## 3. Dominio I: Identity Integrity (`O6.1`)

Verifica la coherencia genealógica y la unicidad de las identidades operacionales a través de todas las fronteras del sistema.

- **Motor:** `src/operations/O6/CrossLayerIdentityIntegrityEngine.js`
- **Suite TDD:** `test/operations/O6/CrossLayerIdentityIntegrityContract.test.js`

| Invariante | Descripción Normativa | Código de Error / Comportamiento |
|---|---|---|
| **I1** | **Valid Root Identity:** Toda cadena auditada debe poseer una `executionId` raíz válida y obligatoria. | `INVALID_IDENTITY_RECORD` |
| **I2** | **Candidate Binding:** La identidad del candidato de release (`candidateId`) debe estar inequívocamente vinculada a la ejecución. | `CANDIDATE_IDENTITY_MISMATCH` |
| **I3** | **Release Binding:** Todo release autorizado debe descender de un candidato válido de la misma ejecución. | `RELEASE_IDENTITY_MISMATCH` |
| **I4** | **Distribution Binding:** El manifiesto de distribución debe estar enlazado soberanamente al release autorizado. | `DISTRIBUTION_IDENTITY_MISMATCH` |
| **I5** | **No Cross-Binding:** Se prohíbe terminantemente mezclar identidades operacionales de genealogías distintas. | `CROSS_LAYER_IDENTITY_CONFLICT` |
| **I6** | **Identity Uniqueness:** Cada identificador de capa debe representar una entidad única y no colisionar. | `IDENTITY_UNIQUENESS_VIOLATION` |
| **I7** | **Incident Identity Binding:** Todo registro de incidente en O5 debe enlazar correctamente con su ejecución origen. | `INCIDENT_IDENTITY_MISMATCH` |
| **I8** | **Remediation Identity Binding:** Una ejecución remediada debe preservar el vínculo genealógico con su incidente. | `REMEDIATION_IDENTITY_MISMATCH` |
| **I9** | **Manifest Identity Consistency:** La identidad del manifiesto debe reflejar fielmente el alcance del release auditado. | `MANIFEST_IDENTITY_BREAK` |
| **I10** | **Deterministic Identity Verdict:** El mismo conjunto de identidades produce idéntico `identityVerdictHash`. | Determinismo SHA-256 canónico |
| **I11** | **Idempotent Identity Verification:** Consultas repetidas sobre la misma identidad devuelven el mismo veredicto inalterado. | Idempotencia en memoria (`Map`) |
| **I12** | **Read-Only Identity Boundary:** El motor O6.1 observa y dictamina; prohibición absoluta de modificar identidades históricas. | Garantía de solo lectura |

---

## 4. Dominio H: End-to-End Hash Lineage (`O6.2`)

Verifica la continuidad criptográfica y el determinismo de punta a punta, asegurando que las huellas de origen, manifiestos y libros mayores formen una línea ininterrumpida.

- **Motor:** `src/operations/O6/EndToEndHashLineageEngine.js`
- **Suite TDD:** `test/operations/O6/EndToEndHashLineageContract.test.js`

| Invariante | Descripción Normativa | Código de Error / Comportamiento |
|---|---|---|
| **H1** | **Root Evidence Hash:** Rechaza cadenas donde falte u se altere el hash de evidencia de origen (O1). | `ROOT_EVIDENCE_MISSING` / `HASH_LINEAGE_BREAK` |
| **H2** | **Ledger Lineage Continuity:** Los registros del libro mayor (O3) deben mantener continuidad criptográfica estricta. | `LEDGER_LINEAGE_BREAK` |
| **H3** | **Manifest Integrity:** Los manifiestos de distribución (O4) deben conservar la validez de sus hashes firmados. | `MANIFEST_HASH_MISMATCH` |
| **H4** | **Assessment Verdict Binding:** Los dictámenes forenses deben estar sellados criptográficamente a la ejecución origen. | `ASSESSMENT_VERDICT_BREAK` |
| **H5** | **Closure Verdict Binding:** El cierre operacional (O5.6) debe vincularse de forma inquebrantable al linaje de hashes. | `CLOSURE_HASH_MISMATCH` |
| **H6** | **No Broken Links:** Se prohíbe la existencia de eslabones intermedios ausentes en la cadena de hashes. | `HASH_CHAIN_INCOMPLETE` |
| **H7** | **Hash Format Validation:** Todos los hashes aportados deben cumplir estrictamente con el formato SHA-256 hexadecimal. | `INVALID_HASH_FORMAT` |
| **H8** | **Cross-Context Hash Rejection:** Rechaza hashes válidos de manera aislada pero correspondientes a otra genealogía o contexto cruzado. | `HASH_LINEAGE_BREAK` |
| **H9** | **Lineage Completeness:** Rechaza auditorías incompletas si faltan eslabones críticos como el manifiesto o el ledger. | `INCOMPLETE_HASH_AUDIT` |
| **H10** | **Foreign Hash Detection:** Bloquea la introducción de hashes ajenos a la ejecución auditada. | `FOREIGN_HASH_DETECTED` |
| **H11** | **Deterministic Lineage Verdict:** La misma cadena de hashes produce idéntico `lineageVerdictHash`. | Determinismo SHA-256 canónico |
| **H12** | **Read-Only Hash Boundary:** O6.2 observa y dictamina; prohibición absoluta de reescribir o recalcular registros históricos. | Garantía de solo lectura |

---

## 5. Dominio S: Lifecycle State Consistency (`O6.3`)

Verifica la legitimidad cronológica y transicional del autómata global de estados a través de todo el ciclo de vida del sistema.

- **Motor:** `src/operations/O6/LifecycleStateConsistencyEngine.js`
- **Suite TDD:** `test/operations/O6/LifecycleStateConsistencyContract.test.js`

| Invariante | Descripción Normativa | Código de Error / Comportamiento |
|---|---|---|
| **S1** | **Valid Initial State:** Toda secuencia de estados debe comenzar estrictamente en el estado `CREATED`. | `INVALID_INITIAL_STATE` |
| **S2** | **Allowed Transition:** Cada transición de estado debe pertenecer de forma estricta al autómata normativo global. | `LIFECYCLE_STATE_TRANSITION_INVALID` |
| **S3** | **No State Skipping:** Ninguna ejecución puede saltarse estados u compuertas obligatorias (ej. saltar directo a `PRODUCTION`). | `LIFECYCLE_STATE_TRANSITION_INVALID` |
| **S4** | **Chronological Ordering:** Los timestamps de transición deben respetar rigurosamente el orden temporal hacia adelante. | `CHRONOLOGICAL_ORDERING_VIOLATION` |
| **S5** | **Identity-State Binding:** El estado auditado debe pertenecer inequívocamente a la identidad operacional correcta. | `IDENTITY_STATE_BINDING_ERROR` |
| **S6** | **Certification Precondition:** El acceso al estado `PRODUCTION` exige de forma obligatoria estados previos `CERTIFIED` y `RELEASE_AUTHORIZED`. | `CERTIFICATION_PRECONDITION_FAILED` |
| **S7** | **Distribution Precondition:** El estado `DISTRIBUTED` exige una promoción previa válida a `PRODUCTION`. | `DISTRIBUTION_PRECONDITION_FAILED` |
| **S8** | **Terminal State Dominance:** Estados terminales como `FAILED`, `QUARANTINED` y `CLOSED` no admiten reversiones silenciosas. | `TERMINAL_STATE_MUTATION_FORBIDDEN` |
| **S9** | **Incident State Compatibility:** Un incidente registrado debe ser lógicamente compatible con el estado de su ejecución origen. | `INCIDENT_STATE_INCOMPATIBLE` |
| **S10** | **Remediation State Compatibility:** Una ejecución remediada debe poseer un linaje genealógico válido desde su incidente correspondiente. | `REMEDIATION_STATE_INCOMPATIBLE` |
| **S11** | **Deterministic State Verdict:** La misma secuencia de estados y tiempos produce idéntico `stateVerdictHash`. | Determinismo SHA-256 canónico |
| **S12** | **Read-Only Historical Boundary:** O6.3 observa y dictamina; prohibición absoluta de mutar o reescribir estados históricos. | Garantía de solo lectura |

---

## 6. Dominio G: Evidence Graph Consistency (`O6.4`)

Verifica la topología genealógica y la consistencia del DAG (Directed Acyclic Graph) histórico, asegurando la ausencia de nodos huérfanos y ciclos imposibles.

- **Motor:** `src/operations/O6/EvidenceGraphConsistencyEngine.js`
- **Suite TDD:** `test/operations/O6/EvidenceGraphConsistencyContract.test.js`

| Invariante | Descripción Normativa | Código de Error / Comportamiento |
|---|---|---|
| **G1** | **Valid Graph Root:** Todo grafo histórico debe poseer una raíz genealógica válida y verificable. | `EMPTY_GRAPH_ROOT` / `GRAPH_ROOT_MISSING` |
| **G2** | **Node Identity Uniqueness:** Cada identidad representa un único nodo indiscutible dentro del grafo; se prohíben duplicados. | `NODE_IDENTITY_UNIQUENESS_VIOLATION` |
| **G3** | **Valid Edge Binding:** Toda relación de descendencia o parentalidad debe respaldarse por un binding soberano (`from` / `to`). | `INVALID_EDGE_BINDING` |
| **G4** | **No Orphan Nodes:** Inexistencia absoluta de nodos secundarios huérfanos sin linaje o aristas entrantes legítimas. | `ORPHAN_GRAPH_NODE` |
| **G5** | **Parent Existence:** Todo nodo descendiente debe apuntar imperativamente a un progenitor existente en el grafo. | `PARENT_EXISTENCE_VIOLATION` |
| **G6** | **Remediation Genealogy:** Una ejecución remediada debe descender formalmente del incidente que la originó. | `REMEDIATION_GENEALOGY_BREAK` |
| **G7** | **No Impossible Cycles:** El grafo genealógico tiene prohibido estrictamente contener ciclos o bucles temporales cerrados. | `IMPOSSIBLE_GRAPH_CYCLE_DETECTED` |
| **G8** | **Cross-Layer Edge Consistency:** Las aristas del grafo deben respetar rigurosamente los bindings certificados por O6.1–O6.3. | `CROSS_LAYER_EDGE_CONFLICT` |
| **G9** | **Historical Branch Preservation:** Una remediación crea una nueva rama genealógica sin eliminar la rama original (modelo append-only). | `HISTORICAL_BRANCH_VIOLATION` |
| **G10** | **Graph Completeness:** Obligatoriedad de presencia de todas las relaciones probatorias obligatorias del ciclo. | `GRAPH_COMPLETENESS_ERROR` |
| **G11** | **Deterministic Graph Verdict:** El mismo grafo canónico produce exactamente el mismo `graphVerdictHash`. | Determinismo SHA-256 canónico |
| **G12** | **Read-Only Historical Boundary:** O6.4 audita y dictamina; prohibición absoluta de mutar, mover o rebindear nodos históricos. | Garantía de solo lectura |

---

## 7. Dominio F: Cross-Layer Failure Propagation (`O6.5`)

Verifica dinámicamente que un fallo operacional dispare los circuitos institucionales completos de contención y bloquee de forma inapelable las fronteras de distribución y promoción de O4.

- **Motor:** `src/operations/O6/CrossLayerFailurePropagationEngine.js`
- **Suite TDD:** `test/operations/O6/CrossLayerFailurePropagationContract.test.js`

| Invariante | Descripción Normativa | Código de Error / Comportamiento |
|---|---|---|
| **F1** | **Valid Failure Origin:** El fallo auditado debe estar vinculado de forma inequívoca a una `executionId` válida en estado `FAILED`. | `VALID_FAILURE_ORIGIN_REQUIRED` |
| **F2** | **Incident Intake Binding:** Todo fallo registrado debe desencadenar un `IncidentDetectionRecord` válido en O5.1. | `FAILURE_PROPAGATION_BREAK` |
| **F3** | **Classification Propagation:** El incidente correspondiente debe poseer una clasificación activa en O5.2 (`CLASSIFIED`). | `FAILURE_PROPAGATION_BREAK` |
| **F4** | **Quarantine Propagation:** El recurso afectado por el fallo debe alcanzar obligatoriamente el estado `QUARANTINED` en O5.3. | `FAILURE_PROPAGATION_BREAK` |
| **F5** | **Distribution Boundary Enforcement:** Un artefacto comprometido y en cuarentena tiene prohibido absoluto alcanzar el estado `DISTRIBUTED` o `PRODUCTION`. | `DISTRIBUTED_BOUNDARY_VIOLATION` |
| **F6** | **Promotion Boundary Enforcement:** Un fallo no resuelto bloquea inexorablemente cualquier promoción posterior en O4 (`promotionBlocked === true`). | `PROMOTION_BOUNDARY_VIOLATION` |
| **F7** | **Failure Lineage Preservation:** La trazabilidad `executionId ➔ incidentId` debe conservarse sin rupturas. | `FAILURE_LINEAGE_BREAK` |
| **F8** | **Remediation Compatibility:** Toda remediación posterior debe descender genealógicamente del incidente que provocó el fallo. | `REMEDIATION_COMPATIBILITY_ERROR` |
| **F9** | **No Historical Mutation:** El proceso de auditoría de propagación jamás muta ni altera la evidencia preexistente. | Garantía de solo lectura |
| **F10** | **Deterministic Propagation Verdict:** El mismo escenario causal produce exactamente el mismo `propagationVerdictHash`. | Determinismo SHA-256 canónico |
| **F11** | **Read-Only Systemic Boundary:** O6.5 observa, verifica y dictamina; prohibición absoluta de modificar O1–O5. | Garantía de solo lectura |
| **F12** | **Complete Failure Containment:** Imposibilidad lógica de que un fallo contenido escape hacia canales de distribución. | `COMPLETE_CONTAINMENT_FAILURE` |

---

## 8. Dominio SC: Systemic Certification & Governance (`O6.6`)

Compone los cinco dictámenes transversales de O6 en un Veredicto Sistémico Global (`SystemicVerdict`), aplicando una función puramente determinista y de solo lectura.

- **Motor:** `src/operations/O6/SystemicCertificationGovernanceEngine.js`
- **Suite TDD:** `test/operations/O6/SystemicCertificationGovernanceContract.test.js`

| Invariante | Descripción Normativa | Código de Error / Comportamiento |
|---|---|---|
| **SC1** | **Valid Systemic Binding:** Todo veredicto sistémico debe poseer un `executionId` raíz válido. | `VALID_SYSTEMIC_BINDING_REQUIRED` |
| **SC2** | **Complete O6 Verdict Set:** Obligatoriedad absoluta de aportar los 5 dictámenes transversales de O6 (`O6.1` a `O6.5`). | `COMPLETE_O6_VERDICT_SET_REQUIRED` |
| **SC3** | **Common Genealogical Identity:** Todas las evidencias y veredictos deben compartir exactamente la misma identidad operacional. | `SYSTEMIC_INTEGRITY_CONFLICT` |
| **SC4** | **Identity Verdict Binding:** Integridad y validez vinculante del veredicto `O6.1` (`Identity Integrity`). | `SYSTEMIC_VERDICT_FAILURE` |
| **SC5** | **Hash Lineage Verdict Binding:** Integridad y validez vinculante del veredicto `O6.2` (`Hash Lineage`). | `SYSTEMIC_VERDICT_FAILURE` |
| **SC6** | **State Consistency Verdict Binding:** Integridad y validez vinculante del veredicto `O6.3` (`State Consistency`). | `SYSTEMIC_VERDICT_FAILURE` |
| **SC7** | **Evidence Graph Verdict Binding:** Integridad y validez vinculante del veredicto `O6.4` (`Evidence Graph`). | `SYSTEMIC_VERDICT_FAILURE` |
| **SC8** | **Failure Propagation Verdict Binding:** Integridad y validez vinculante del veredicto `O6.5` (`Failure Propagation`). | `SYSTEMIC_VERDICT_FAILURE` |
| **SC9** | **Cross-Verifier Compatibility:** Prevención estricta de conflictos cruzados (rechazo categórico de desalineaciones genealógicas o estados no exitosos). | `SYSTEMIC_INTEGRITY_CONFLICT` |
| **SC10** | **Systemic Determinism:** El mismo conjunto compositivo produce siempre el mismo `systemicVerdictHash` (aislando timestamps operacionales). | Determinismo SHA-256 canónico |
| **SC11** | **Systemic Verdict Idempotency:** Solicitudes idénticas repetidas devuelven la misma certificación sin alteraciones (`idempotentRepeat: true`). | Idempotencia en memoria |
| **SC12** | **Read-Only Historical Boundary:** O6.6 compone y dictamina; prohibición absoluta de mutar, reescribir o alterar O1–O6.5. | Garantía de solo lectura |

---

## 9. Garantías de Restricción y Mutación

Conforme al marco establecido en `01-Architectural-Overview.md`, el presente registro certifica que:
1. **Ningún motor de O6** posee capacidad de escritura, mutación o reescritura sobre los artefactos de las capas O1–O5.
2. Cualquier intento de violar un invariante de los rangos `I`, `H`, `S`, `G`, `F` o `SC` detiene inmediatamente la ejecución con su respectivo código de error normativo y bloquea la emisión del veredicto sistémico.
3. El cumplimiento simultáneo de los 72 invariantes (`12 × 6`) es el requisito absoluto para que una ejecución alcance el estado de `SYSTEMIC_CERTIFIED` dentro del `GLOBAL-SYSTEMIC-BASELINE-001`.

---

## 10. Estado del Documento

```text
DOCUMENT: 02-Contract-Registry.md

BASELINE:
GLOBAL-SYSTEMIC-BASELINE-001

SCOPE:
Invariants I1–I12, H1–H12, S1–S12, G1–G12, F1–F12, SC1–SC12

STATUS:
FROZEN

AUTHORITY:
Normative reference for all O6 verification engines and TDD contracts.