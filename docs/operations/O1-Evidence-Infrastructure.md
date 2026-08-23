```text
====================================================================
  📄 COMPENDIO CANÓNICO DE OPERACIÓN Y GOBERNANZA (O6)
  DOCUMENTO OFICIAL: docs/operations/O1-Evidence-Infrastructure.md
====================================================================

```

# O1 — Runtime & Evidence Infrastructure Architecture

**Estado:** 🟢 CERTIFIED / FROZEN

**Baseline:** LexDigitalHD Production Certification Baseline (E18–E26)

**Sistemas Operativos Compatibles:** Windows 11 (Entorno de desarrollo actual) y Linux Mint (Entorno de producción final)

---

## 1. Propósito y Alcance

La infraestructura de evidencia y runtime (**O1**) constituye el perímetro de persistencia inmutable y soberana de LexDigitalHD. Su responsabilidad exclusiva no es procesar semántica jurídica ni emitir juicios de valor sobre los artefactos, sino **recibir, normalizar, sellar y persistir de forma atómica e íntegra toda la evidencia contractual generada por los motores de orquestación y renderizado (E24–E26)**.

Este documento formaliza la implementación de **O1.1 (Evidence Persistence Engine)** y **O1.2 (Job Identity & Runtime Engine)**, garantizando que el sistema sea completamente agnóstico al sistema operativo y cumpla con el principio de soberanía operacional: *una ejecución no es confiable porque el sistema diga que fue correcta, sino porque conserva la evidencia inalterable para demostrarlo*.

---

## 2. Arquitectura de Identidad y Runtime (O1.2)

Toda ejecución operacional de LexDigitalHD se rige por una jerarquía determinista de identidades que evita el uso de identificadores caóticos y permite la reconstrucción forense total.

### 2.1 Jerarquía Estructural

```text
jobIdentity (Identidad lógica persistente del trabajo / corpus)
    │
    └── executionId (Corrida concreta y aislada)
          │
          └── sessionId (Contexto runtime de la sesión)
                │
                ├── commandId (Operación IPC / Comando físico unívoco)
                ├── commandId
                └── ...

```

### 2.2 Invariantes de Identidad (J1–J7)

* **J1 (Job Identity Stability):** El `jobIdentity` permanece inalterable durante todo el ciclo lógico del corpus.
* **J2 (Execution Isolation):** Cada instancia de ejecución genera un `executionId` único, previniendo colisiones entre corridas.
* **J3-J4 (Session & Command Binding):** Cada comando de renderizado o procesamiento queda unívocamente correlacionado a su sesión y ejecución.
* **J5 (Identity Propagation):** Las identidades viajan intactas a través de todo el pipeline (E24 ➔ E25 ➔ E26 ➔ O1.1).
* **J6 (Runtime Noise Isolation):** Se eliminan sistemáticamente metadatos volátiles del entorno (como el PID del sistema operativo, el hostname o marcas de tiempo locales) para evitar la contaminación de los hashes canónicos.
* **J7 (Identity Immutability):** Las estructuras de identidad se congelan (`Object.freeze`) inmediatamente tras su emisión.

---

## 3. Perímetro de Persistencia y Serialización Canónica (O1.1)

El motor de persistencia abstrae el almacenamiento físico para garantizar portabilidad absoluta y resistencia a fallos de infraestructura.

### 3.1 Normalización de Rutas (Windows 11 ➔ Linux Mint)

Para evitar que las diferencias entre separadores de directorios (`\` en Windows vs `/` en Linux) alteren los hashes criptográficos de procedencia, O1.1 implementa una normalización estricta de rutas físicas a identificadores de recursos canónicos:

* Las barras invertidas se convierten en barras diagonales (`/`).
* Se suprimen las letras de unidades de disco locales (ej. `C:\`).

### 3.2 Serialización Determinista

Cualquier payload contractual se serializa aplicando una ordenación recursiva y profunda de las claves de sus objetos JSON (`Object.keys().sort()`), garantizando que el mismo contenido produzca exactamente los mismos bytes canónicos independientemente de la plataforma de ejecución.

### 3.3 Protocolo de Escritura Atómica (.tmp ➔ Flush ➔ Verify ➔ Rename)

Para prevenir evidencias corruptas ante caídas imprevistas del proceso Node.js, la persistencia opera bajo un ciclo estrictamente atómico:

1. Se prepara el payload con su hash SHA-256 canónico (`evidenceHash`).
2. Se escribe temporalmente en un archivo aleatorio `.tmp`.
3. Se realiza una lectura y verificación inmediata de los bytes escritos en disco.
4. Se ejecuta un `renameSync` atómico hacia el archivo definitivo `.json`.
5. Se aplica un sellado físico de inmutabilidad (`chmod 0444` / Read-Only).

---

## 4. Estructura del Repositorio de Evidencia

Toda la evidencia persistida se organiza bajo un árbol estandarizado dentro de la raíz de almacenamiento:

```text
evidence/
└── <jobIdentity>/
    └── <executionId>/
        ├── execution.json
        ├── identities/
        │   ├── input.json
        │   ├── ast.json
        │   └── projection-plan.json
        ├── orchestration/
        │   └── e24-evidence.json
        ├── rendering/
        │   ├── commands.json
        │   ├── mutations.json
        │   └── read-back.json
        ├── governance/
        │   ├── certification-record.json
        │   ├── artifact-manifest.json
        │   ├── multi-format-certification.json
        │   ├── release-decision.json
        │   ├── lineage-certificate.json
        │   ├── reproducibility-certificate.json
        │   └── production-corpus-certificate.json
        └── evidence-manifest.json

```

---

## 5. Criterios de Aceptación y Certificación TDD

La infraestructura O1 se encuentra formalmente certificada mediante la superación de sus suites de pruebas automatizadas:

* **`EvidencePersistenceContract.test.js`** ➔ 3/3 Suites / 6 Invariantes superados (`O1.1-A` a `O1.1-F`).
* **`JobIdentityContract.test.js`** ➔ 7 Invariantes de runtime superados (`J1` a `J7`).

Cualquier cambio propuesto que viole la inmutabilidad de la evidencia sellada o introduzca dependencia de rutas locales del sistema operativo será rechazado por la suite de contratos.