# Glosario — LexDigitalHD 2.0

Documento orientado al integrante humano del proyecto (diseñador editorial + director de automatización). Los términos están ordenados por área y explicados con analogías cuando aportan claridad.

---

## 1. Conceptos editoriales

**CIDM** (Canonical InDesign Document Model)
Modelo canónico que representa el documento tal como está en InDesign. Es la "fotografía" del diseño: estilos, bloques, jerarquías. Equivale a la estructura que InDesign conoce internamente.

**LEDM** (LexDigital Editorial Document Model)
Modelo editorial propio de LexDigitalHD. Es la versión procesada y semántica del CIDM, lista para compilar a HTML, PDF, EPUB o XHTML.

**AST** (Abstract Syntax Tree)
Árbol sintáctico abstracto. Es una representación jerárquica de la estructura de un documento. En el proyecto se usa para detectar anclas, secciones y jerarquías.

**Estilo de párrafo / carácter**
En InDesign, un estilo es un conjunto de reglas tipográficas. En el proyecto, cada estilo se mapea a una clase CSS (kebab-case).

**kebab-case**
Formato de nombre en minúsculas separadas por guiones: `p01-body-cont`. Es el estándar en el proyecto para clases CSS.

**Párrafo inicial / de continuación**
En tipografía editorial: el primero no lleva sangría, los siguientes sí. En el proyecto se codifica como `.p01-body-first` y `.p01-body-cont`.

**Justificado con hyphens**
Alineación a ambos lados con separación automática de sílabas. Evita "ríos" de espacio en blanco.

---

## 2. Arquitectura del código

**Core**
Núcleo del sistema. Vive en `src/core/`. Contiene la lógica canónica de compilación.

**Wrapper**
Archivo delgado en `scripts/` que solo delega en `src/core/`. No tiene lógica propia.

**Fachada (Facade)**
Módulo que expone una API unificada de otros módulos. En el proyecto: `src/core/compiladores/index.js`.

**Validador**
Módulo que verifica si algo cumple las reglas esperadas. Ej: integridad, anclas, enlaces externos.

**Compilador**
Módulo que transforma datos de entrada (ej. LEDM) en artefactos de salida (HTML, PDF, JSON).

**Dashboard**
Panel HTML público que muestra un aspecto del sistema: integridad, métricas, novedades, etc.

**Pipeline**
Cadena de pasos que transforma datos desde su origen hasta su destino final.

**Contrato**
Archivo JSON que declara el alcance, criterios y garantías de un MVP. Sin contrato no se implementa.

---

## 3. Procesos y disciplina

**MVP** (Minimum Viable Product)
Unidad de funcionalidad cerrada y verificable. Cada MVP tiene contrato, tests y cierre formal.

**-FIX**
Sufijo para MVPs correctivos. Ej: `MVP-054-FIX` corrige hallazgos de auditoría sin añadir funcionalidad.

**Baseline**
Estado congelado del repositorio en un punto verificado. Se etiqueta con un tag.

**Pausa de estabilidad**
Fase en la que no se modifica el código. Solo se permite auditoría y configuración de infraestructura.

**Criterio de aceptación**
Regla objetiva que determina si un MVP está completo o no.

**Auditoría**
Revisión externa de la arquitectura o del código para detectar riesgos.

**Hotfix**
Corrección urgente contra un baseline congelado, con causa justificada y documentada.

---

## 4. Pruebas y verificación

**Test unitario**
Prueba que verifica una función o módulo aislado.

**Test contractual**
Prueba que verifica que un contrato existe y cumple su estructura mínima.

**Test de builder**
Prueba que verifica que un generador produce el artefacto esperado.

**Suite**
Conjunto completo de pruebas. En el proyecto: `npx jest --runInBand`.

**Test de unicidad**
Test que verifica que no hay lógica duplicada entre `scripts/` y `src/core/`.

**Test de ciclos**
Test que verifica que no hay dependencias circulares en `src/core/`.

**Test de aislamiento**
Test que verifica que `src/core/` no depende de capas externas.

---

## 5. Codificación y caracteres

**BOM** (Byte Order Mark)
Carácter invisible (`\uFEFF`) al inicio de un archivo. Puede romper analizadores JSON estrictos.

**UTF-8 sin BOM**
Codificación estándar del proyecto. Todos los archivos deben guardarse así.

**Escapado HTML**
Reemplazar caracteres especiales (`<`, `>`, `&`, `"`) por entidades seguras.

**XML escaping**
Igual que HTML, aplicado a feeds y sitemaps.

---

## 6. Infraestructura

**Cloudflare Pages**
Servicio de hosting estático usado para publicar `public/`.

**GitHub Actions**
Sistema de CI/CD que construye y despliega el sitio.

**DNS** (Domain Name System)
Sistema que traduce `www.lexdigitalhd.com` a un servidor.

**HTTPS**
Protocolo seguro de publicación web. Requerido por el proyecto.

**CNAME**
Tipo de registro DNS que apunta un subdominio a otro dominio.

---

## 7. Servicios y procesos del sistema

**Watchdog**
Servicio de Node.js que escucha peticiones IPC en el puerto 8765.

**Heartbeat**
Señal periódica (cada 3 s) que indica que el sistema está vivo.

**IPC** (Inter-Process Communication)
Comunicación entre procesos mediante archivos (`ipc/requests`, `ipc/responses`).

**SSE** (Server-Sent Events)
Canal HTTP que envía eventos en tiempo real desde el servidor al navegador.

**Endpoint**
Ruta HTTP que expone una funcionalidad. Ej: `/health`, `/build`, `/render`.

**systemd**
Sistema de Linux que permite ejecutar servicios automáticamente al arrancar.

---

## 8. Conceptos de proyecto

**Gobernanza**
Reglas sobre cómo se decide, se propone y se registra en el proyecto. Ver `docs/GOBERNANZA.md`.

**Agente IA**
Asistente con rol específico: DeepSeek (arquitecto), ChatGPT (auditor), Gemini PRO (auditor secundario).

**Baseline v1.0.3-modular-hardened**
Estado actual del proyecto: núcleo aislado, sin ciclos, BOM centralizado, suite 435/435.

---

## 9. Analogías útiles

**Core vs Wrappers**
Como una editorial: el core es la imprenta; los wrappers son los mensajeros que llevan el pedido a la imprenta.

**Contrato**
Como un pliego de condiciones editorial: define qué se entrega antes de empezar.

**Pausa de estabilidad**
Como cerrar la edición de un libro: no se toca el texto hasta que haya razón concreta.

**Test de aislamiento**
Como verificar que un capítulo no depende de otro libro para existir.

**BOM**
Como una marca invisible que solo el corrector más estricto detecta, pero que puede arruinar un índice.

---

## 10. Flujo completo en una frase

> Un documento de InDesign se extrae como CIDM, se convierte en LEDM, se compila en HTML/PDF/EPUB/XHTML mediante el core modular, se valida con tests automatizados y se publica en Cloudflare Pages.

