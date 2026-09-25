# MVP-057-DESIGN-ACCESSIBILITY-CONTRACT

**Versión:** 0.1.0-draft\
**Estado:** Borrador Oficial / Contrato Operativo y Arquitectónico\
**Naturaleza:** Contrato transversal de gobernanza técnica, accesibilidad, legibilidad, UX y calidad editorial\
**Ecosistema:** LexDigitalHD\
**Base Tecnológica:** Núcleo Determinista LexDigitalHD — Baseline E18–E26 + Régimen Operacional O1–O6\
**Entorno de Validación:** Linux Mint / Windows 11\
**Trazabilidad:** SHA-256 para integridad y reproducibilidad de artefactos\
**Autoridad de decisión:** Dirección del proyecto LexDigitalHD\
**Auditor externo consultivo:** Gemini Pro\
**Estado de implementación:** No iniciado mediante este contrato

---

# 1. Visión General y Propósito

El presente documento constituye el contrato técnico, normativo y arquitectónico transversal para el ecosistema LexDigitalHD en materia de accesibilidad, legibilidad, experiencia de usuario, calidad editorial, tecnología de publicación y validación de artefactos digitales.

Su propósito es establecer criterios verificables para que la información jurídica y editorial procesada por LexDigitalHD pueda ser transformada y proyectada hacia diferentes canales sin pérdida injustificada de significado, estructura, integridad, accesibilidad o trazabilidad.

LexDigitalHD se define, para efectos de este contrato, como un sistema de procesamiento editorial **determinista, auditable, reproducible y orientado a la evidencia**.

El principio rector será:

> **La legibilidad y la accesibilidad son requisitos funcionales; la estética es la forma en que esos requisitos se presentan.**

La calidad visual no podrá utilizarse para compensar deficiencias estructurales, semánticas, de accesibilidad o de experiencia de lectura.

---

# 2. Principio de Soberanía de la Evidencia

Toda transformación relevante realizada por el pipeline deberá poder relacionarse con una fuente, regla, decisión o evidencia identificable.

La cadena de procesamiento deberá permitir reconstruir, dentro de los límites definidos por cada artefacto y entorno:

```text
fuente semántica
      ↓
ingesta
      ↓
normalización
      ↓
procesamiento determinista
      ↓
proyección específica del canal
      ↓
validación
      ↓
artefacto terminal
      ↓
evidencia de auditoría
```

La trazabilidad criptográfica mediante SHA-256 tendrá como finalidad principal:

- verificar integridad;
- identificar determinísticamente artefactos;
- comparar resultados;
- detectar modificaciones;
- respaldar la trazabilidad de compilaciones.

**SHA-256 no será considerado por sí mismo una prueba de autoría, identidad o autenticidad jurídica.**

Cuando el proyecto requiera autenticidad criptográfica de identidad, deberá existir un mecanismo adicional específicamente diseñado para ello.

---

# 3. Alcance Transversal

MVP-057 tendrá alcance sobre todo el ecosistema LexDigitalHD.

Comprende:

1. Publicación Web.
2. EPUB accesible.
3. PDF accesible.
4. PDF orientado a producción gráfica.
5. Interfaces editoriales presentes o futuras.
6. Modelos semánticos y AST que actúen como fuente de verdad.
7. Sistemas de transformación y compilación.
8. Componentes de interacción.
9. Tecnologías asistivas.
10. Procesos de auditoría y validación.
11. Contenido editorial real y contenido demostrativo.
12. Rendimiento y comportamiento responsive.
13. Legibilidad y experiencia de lectura jurídica.

MVP-057 no sustituye los contratos técnicos específicos de cada canal.

Cada formato conservará sus propias normas y mecanismos de conformidad.

---

# 4. Relación con MVP-009 — Design System Base

MVP-057 no sustituye ni duplica el contrato de Design System Base.

La separación de responsabilidades será:

### MVP-009

Define:

- tokens;
- perfiles visuales;
- taxonomía visual;
- tipografía;
- colores;
- espaciado;
- componentes;
- reglas visuales;
- perfiles Web;
- perfiles EPUB;
- perfiles PDF/UA;
- perfiles de impresión.

### MVP-057

Define:

- accesibilidad;
- legibilidad;
- UX;
- semántica;
- interacción;
- tecnologías asistivas;
- responsive/reflow;
- preferencias del usuario;
- rendimiento;
- validación;
- evidencia;
- calidad editorial;
- reglas de aceptación.

Por tanto:

> **MVP-009 define el lenguaje visual; MVP-057 define las condiciones funcionales, accesibles y de calidad bajo las cuales dicho lenguaje debe utilizarse.**

---

# 5. Jerarquía de Prioridades

Cuando exista conflicto entre criterios, se aplicará la siguiente prioridad:

1. Corrección semántica y estructural.
2. Accesibilidad.
3. Compatibilidad con tecnologías asistivas.
4. Legibilidad.
5. Experiencia de usuario.
6. Responsive y reflow.
7. Rendimiento.
8. Consistencia con el Design System.
9. Estética visual.

Una decisión estética no podrá justificar una degradación de un requisito superior.

---

# 6. Clasificación de Requisitos

El contrato distinguirá estrictamente:

## 6.1 Requisitos normativos

Obligaciones derivadas de estándares aplicables al canal.

Ejemplos:

- WCAG 2.2 AA para Web;
- WAI-ARIA cuando resulte aplicable;
- EPUB Accessibility;
- PDF/UA;
- requisitos técnicos específicos del formato.

WCAG 2.2 establece, entre otros, los criterios de contraste, redimensionamiento de texto, reflow, contraste no textual, teclado, foco y navegación utilizados como referencia en este contrato.

## 6.2 Requisitos propios de LexDigitalHD

Reglas arquitectónicas y operativas que exceden o concretan las obligaciones normativas:

- fuente de verdad semántica;
- determinismo;
- trazabilidad;
- integridad;
- separación de canales;
- evidencia;
- prohibición de contenido jurídico ficticio presentado como real;
- matriz de pruebas;
- gobernanza de auditorías.

## 6.3 Criterios de calidad

Buenas prácticas destinadas a mejorar:

- legibilidad;
- experiencia de lectura;
- claridad;
- rendimiento;
- mantenibilidad;
- resiliencia;
- consistencia editorial.

Los criterios de calidad no podrán presentarse como requisitos normativos cuando no lo sean.

---

# 7. Estándares y Referencias Normativas

## 7.1 Web

La referencia primaria será:

**WCAG 2.2 — Level AA.**

WCAG 2.2 es una W3C Recommendation.

Cuando resulte aplicable, se utilizará WAI-ARIA 1.2 como referencia para roles, estados y propiedades accesibles. WAI-ARIA 1.2 es igualmente una W3C Recommendation.

## 7.2 EPUB

La referencia normativa de publicación será:

**EPUB Accessibility 1.1**, junto con EPUB 3.3 y los requisitos WCAG aplicables.

EPUB Accessibility 1.1 es actualmente una W3C Recommendation.

EPUB Accessibility 1.2 será tratado, mientras permanezca como Candidate Recommendation Draft, como referencia de evolución técnica y no como requisito normativo obligatorio salvo decisión contractual posterior.

## 7.3 PDF accesible

El perfil accesible se regirá por:

**PDF/UA — ISO 14289-1**, en la versión contractual aplicable al proyecto.

Las validaciones deberán contemplar, según corresponda al documento:

- estructura semántica;
- árbol de estructura;
- orden lógico de lectura;
- idioma;
- nombres y descripciones accesibles;
- etiquetado;
- tablas;
- imágenes;
- metadatos;
- navegación;
- compatibilidad con tecnologías asistivas.

## 7.4 PDF de producción gráfica

PDF/X y los perfiles de impresión serán tratados como requisitos de producción gráfica.

El cumplimiento de un perfil PDF/X no se considerará equivalente al cumplimiento de PDF/UA.

---

# 8. Arquitectura de Accesibilidad Desde el AST

El AST Universal será la fuente de verdad semántica del proceso.

No se establecerá una correspondencia contractual obligatoria:

```text
AST node → HTML tag
AST node → EPUB tag
AST node → PDF tag
```

La arquitectura deberá funcionar conceptualmente de la siguiente manera:

```text
                AST UNIVERSAL
              fuente de verdad
                     │
          semántica editorial
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
     Web          EPUB          PDF
   modelo HTML   modelo EPUB   modelo PDF/UA
        │            │            │
        ↓            ↓            ↓
   validación    validación    validación
```

Cada canal deberá traducir la semántica del AST al modelo estructural propio de su formato.

La traducción:

- no podrá inventar significado;
- no podrá eliminar significado sin justificación;
- no podrá degradar jerarquías;
- deberá conservar el orden semántico;
- deberá conservar las relaciones estructurales relevantes;
- deberá producir la representación accesible apropiada para el canal.

---

# 9. Contrato de Entrada y Normalización

Todo contenido destinado al compilador deberá ingresar mediante un modelo estructurado y validable.

Los nodos semánticos podrán representar, entre otros:

- `chapter`;
- `article`;
- `paragraph`;
- `table`;
- `note`;
- `definition`;
- estructuras equivalentes definidas posteriormente por contrato.

La normalización podrá realizar:

- aplicación de valores por defecto definidos contractualmente;
- saneamiento de caracteres;
- normalización de codificación;
- validación de metadatos;
- normalización estructural;
- preparación para las fases posteriores del pipeline.

La normalización no podrá alterar silenciosamente el significado jurídico.

---

# 10. Política Fail-Safe

Ante discrepancias no críticas, el sistema podrá aplicar mecanismos de tolerancia controlada.

Toda corrección automática deberá:

1. estar definida por una regla;
2. ser determinista;
3. ser reproducible;
4. poder registrarse;
5. generar evidencia cuando sea relevante;
6. evitar alterar el significado jurídico.

Una advertencia no podrá ocultarse mediante una corrección silenciosa cuando dicha corrección pueda modificar:

- significado;
- estructura;
- referencias;
- contenido normativo;
- identidad documental.

Cuando una discrepancia pueda comprometer la integridad semántica, el sistema deberá detener o escalar el proceso conforme al contrato específico de ingesta.

---

# 11. Accesibilidad Web

Toda interfaz Web deberá evaluarse respecto de WCAG 2.2 AA.

Como mínimo se verificarán:

- HTML semántico;
- estructura de encabezados;
- landmarks;
- orden lógico;
- nombres accesibles;
- relaciones semánticas;
- ARIA cuando sea necesaria;
- navegación por teclado;
- ausencia de trampas de teclado;
- foco visible;
- foco no oculto;
- estados interactivos;
- enlaces;
- formularios;
- mensajes de error;
- contenido dinámico;
- contenido no textual;
- contraste;
- reflow;
- zoom;
- preferencias del usuario.

WAI-ARIA deberá utilizarse como complemento de HTML semántico y no como sustituto indiscriminado de elementos HTML nativos. WAI-ARIA 1.2 define roles, estados y propiedades para exponer semántica a tecnologías asistivas.

---

# 12. Contraste y Percepción Visual

El contraste será evaluado como sistema funcional, no únicamente como relación texto/fondo.

## 12.1 Texto

Se verificará:

- texto normal: mínimo 4.5:1;
- texto grande: mínimo 3:1;

con las excepciones previstas por WCAG.

WCAG 2.2 establece estos umbrales en el criterio 1.4.3.

## 12.2 Elementos no textuales

Se evaluarán, cuando sean aplicables:

- componentes;
- controles;
- límites relevantes;
- iconos funcionales;
- estados;
- indicadores de foco;
- elementos gráficos necesarios para comprender información.

WCAG 2.2 establece 3:1 para los elementos comprendidos por 1.4.11 Non-text Contrast.

## 12.3 Color

La información no podrá depender exclusivamente del color.

Un estado como:

- vigente;
- seleccionado;
- error;
- advertencia;
- validado;

deberá disponer de una señal adicional cuando resulte necesario para transmitir significado.

---

# 13. Foco y Operación por Teclado

Toda funcionalidad interactiva deberá poder operarse mediante teclado cuando corresponda.

Se verificarán:

- orden de foco;
- visibilidad;
- persistencia;
- ausencia de trampas;
- ausencia de ocultamiento por elementos persistentes;
- estados de foco;
- retorno lógico del foco;
- navegación coherente.

WCAG 2.2 incorpora requisitos específicos para Focus Not Obscured y Focus Appearance.

---

# 14. Zoom y Reflow

Se establecen dos niveles de prueba.

## 14.1 Prueba normativa obligatoria — 200 %

El texto deberá poder redimensionarse hasta **200 %** sin pérdida de contenido o funcionalidad, conforme a WCAG 2.2 SC 1.4.4.

## 14.2 Prueba adicional de calidad — 400 %

La interfaz Web será sometida adicionalmente a una prueba de **400 % de zoom**.

El objetivo será verificar:

- reflow;
- reorganización de contenido;
- ausencia de pérdida funcional;
- lectura en columna cuando resulte apropiado;
- ausencia de desplazamiento horizontal bidimensional injustificado;
- conservación de controles esenciales.

Esta prueba complementará, pero no sustituirá, la evaluación normativa de Reflow.

WCAG 2.2 establece para Reflow la referencia de 320 CSS px para contenido con desplazamiento vertical y 256 CSS px para contenido diseñado para desplazamiento horizontal, con las excepciones correspondientes.

---

# 15. Tamaño de Objetivos y Controles

Cuando resulte aplicable a interfaces Web, se evaluará el tamaño y separación de objetivos interactivos conforme a WCAG 2.2 SC 2.5.8.

El criterio establece como referencia mínima 24 × 24 CSS px, sujeto a sus excepciones.

LexDigitalHD podrá establecer valores superiores mediante el Design System cuando la experiencia editorial lo justifique.

---

# 16. Movimiento y Preferencias del Usuario

Las interfaces deberán respetar `prefers-reduced-motion` cuando existan animaciones o transiciones que puedan afectar a usuarios sensibles al movimiento.

No se introducirán:

- animaciones decorativas innecesarias;
- desplazamientos excesivos;
- efectos que dificulten la lectura;
- transiciones que interfieran con la interacción.

La incorporación de tecnología moderna estará subordinada al valor funcional, editorial, accesible o de rendimiento que aporte.

> **LexDigitalHD utilizará tecnología contemporánea sin convertirse en un laboratorio tecnológico.**

---

# 17. Tecnologías Asistivas

Las pruebas deberán considerar la siguiente matriz.

## 17.1 Matriz primaria

- **Windows + Chrome + NVDA**
- **iOS/iPadOS + Safari + VoiceOver**
- **Android + Chrome + TalkBack**

## 17.2 Matriz complementaria

- **Windows + Edge**
- **Linux + Firefox**
- **macOS + Safari**
- **Orca - Linux**

La prueba deberá considerar, según el artefacto:

- navegación;
- lectura;
- encabezados;
- landmarks;
- enlaces;
- controles;
- estados;
- tablas;
- orden de lectura;
- foco;
- nombres accesibles;
- contenido dinámico;
- semántica jurídica.

---

# 18. Legibilidad

La legibilidad será considerada requisito funcional de publicación.

Se evaluarán:

- tamaño tipográfico;
- longitud de línea;
- interlineado;
- jerarquía;
- separación entre bloques;
- densidad visual;
- contraste;
- reconocimiento de encabezados;
- distinción entre contenido principal y secundario;
- comportamiento con zoom;
- lectura continua;
- lectura fragmentada;
- lectura mediante tecnologías asistivas.

En documentos jurídicos se priorizará la continuidad de lectura y la identificación inequívoca de:

- títulos;
- capítulos;
- artículos;
- parágrafos;
- incisos;
- numerales;
- notas;
- referencias;
- definiciones;
- tablas.

---

# 19. Experiencia de Usuario Jurídica

La UX de LexDigitalHD deberá considerar que el usuario puede necesitar:

- localizar una norma;
- comprender su estructura;
- identificar su vigencia;
- consultar una referencia;
- verificar una versión;
- descargar un artefacto;
- navegar entre secciones;
- regresar a un punto anterior;
- utilizar tecnologías asistivas;
- consultar desde dispositivos móviles.

La interfaz no deberá privilegiar efectos visuales sobre la comprensión jurídica.

Las acciones deberán tener:

- propósito identificable;
- nombre claro;
- estado comprensible;
- respuesta observable;
- comportamiento consistente.

---

# 20. Diseño Responsive

La interfaz deberá adaptarse a:

- escritorio;
- portátil;
- tableta;
- móvil;
- zoom;
- reflow;
- diferentes densidades de pantalla.

La arquitectura deberá evitar dependencias innecesarias de:

- anchuras fijas;
- alturas rígidas;
- contenido visual imprescindible;
- desplazamiento horizontal generalizado;
- componentes que desaparezcan únicamente por falta de espacio.

---

# 21. Rendimiento

El rendimiento se considerará parte de la experiencia de usuario.

No constituye mediante este contrato un contrato independiente de Core Web Vitals.

Se exigirá:

- ausencia de degradaciones injustificadas;
- JavaScript mínimo necesario;
- reducción de dependencias;
- optimización de recursos;
- prioridad al procesamiento estático cuando sea posible;
- eficiencia en dispositivos móviles;
- evaluación del coste de componentes interactivos;
- preservación de las ventajas de la arquitectura estática de LexDigitalHD.

Una mejora visual o funcional no deberá incorporarse si introduce una degradación significativa sin justificación documentada.

---

# 22. Integridad Editorial

La accesibilidad no podrá obtenerse mediante alteraciones arbitrarias del contenido jurídico.

El sistema deberá preservar:

- texto;
- orden;
- relaciones;
- referencias;
- estructura;
- metadatos;
- identidad documental.

Toda transformación editorial deberá distinguir entre:

**contenido de fuente**

y

**presentación o proyección del contenido.**

La presentación no podrá convertirse silenciosamente en una nueva fuente de verdad.

---

# 23. Contenido Real y Contenido Demostrativo

Se establece una prohibición contractual expresa:

> **Ningún contenido ficticio podrá presentarse visual o semánticamente como información jurídica verificada, vigente, íntegra o validada.**

El contenido demostrativo deberá identificarse claramente.

No se permitirá presentar como reales:

- autores ficticios;
- normas ficticias;
- fechas ficticias;
- hashes ficticios;
- estados de vigencia ficticios;
- validaciones inexistentes;
- certificados inexistentes;
- enlaces de verificación inexistentes.

Los prototipos podrán utilizar contenido demostrativo, pero su naturaleza deberá resultar inequívoca.

---

# 24. Estados de Aptitud

Se establecen dos estados principales.

## 24.1 APTA-TÉCNICA

Un artefacto podrá declararse `APTA-TÉCNICA` cuando:

- cumpla los requisitos técnicos aplicables;
- haya superado las validaciones automatizadas pertinentes;
- haya superado las pruebas manuales aplicables;
- haya sido evaluado mediante teclado cuando corresponda;
- haya sido evaluado mediante tecnologías asistivas cuando corresponda;
- haya superado contraste y percepción;
- haya sido evaluado en zoom/reflow;
- haya sido evaluado respecto de legibilidad;
- tenga evidencia de validación;
- no presente defectos críticos conocidos.

## 24.2 APTA-PUBLICACIÓN

Un artefacto podrá declararse `APTA-PUBLICACIÓN` solamente cuando, además de `APTA-TÉCNICA`:

- el contenido sea real;
- el contenido haya sido editorialmente validado;
- los metadatos sean correctos;
- las funciones declaradas sean reales;
- las rutas de navegación sean reales;
- los mecanismos de validación sean reales;
- no exista contenido ficticio presentado como jurídico;
- la experiencia de lectura sea adecuada para producción;
- exista evidencia suficiente para la publicación.

---

# 25. Prohibición de Conformidad Basada Exclusivamente en Automatización

Ninguna interfaz, PDF o EPUB podrá declararse `APTA-TÉCNICA` exclusivamente mediante herramientas automatizadas.

Las herramientas automáticas serán consideradas instrumentos de detección y apoyo.

Deberán complementarse, cuando corresponda, con:

- inspección manual;
- navegación por teclado;
- evaluación visual;
- pruebas de zoom;
- pruebas de reflow;
- revisión semántica;
- tecnologías asistivas;
- revisión del orden de lectura;
- revisión de estados;
- revisión del contenido.

Una puntuación positiva de una herramienta automatizada no constituye por sí misma una declaración de conformidad.

---

# 26. Matriz de Validación

La validación de una interfaz Web deberá contemplar como mínimo:

- [ ] WCAG 2.2 AA evaluada.
- [ ] HTML/semántica verificada.
- [ ] ARIA verificada cuando sea aplicable.
- [ ] Nombres accesibles verificados.
- [ ] Teclado verificado.
- [ ] Foco verificado.
- [ ] Contraste verificado.
- [ ] Componentes y estados verificados.
- [ ] Información no dependiente únicamente del color.
- [ ] Responsive verificado.
- [ ] Reflow verificado.
- [ ] Zoom 200 % verificado.
- [ ] Zoom 400 % evaluado como prueba adicional.
- [ ] Lectores de pantalla evaluados.
- [ ] Matriz primaria evaluada.
- [ ] Matriz complementaria evaluada cuando corresponda.
- [ ] Legibilidad evaluada.
- [ ] UX jurídica evaluada.
- [ ] Estados funcionales verificados.
- [ ] Preferencias del usuario verificadas cuando existan.
- [ ] Movimiento reducido evaluado cuando exista animación.
- [ ] Rendimiento evaluado.
- [ ] Contenido demostrativo correctamente identificado.
- [ ] Evidencia registrada.

---

# 27. Validación Específica por Canal

## Web

Se evaluará:

- WCAG 2.2 AA;
- HTML;
- WAI-ARIA cuando sea aplicable;
- teclado;
- foco;
- contraste;
- reflow;
- zoom;
- tecnologías asistivas;
- rendimiento;
- UX.

## EPUB

Se evaluará:

- EPUB 3.3;
- EPUB Accessibility aplicable;
- WCAG correspondiente;
- metadatos de accesibilidad;
- navegación;
- estructura;
- orden de lectura;
- contenido alternativo;
- tecnologías asistivas;
- comportamiento en sistemas de lectura compatibles.

EPUB Accessibility contempla tanto requisitos de accesibilidad del contenido como metadatos destinados a su descubribilidad.

## PDF accesible

Se evaluará:

- PDF/UA;
- estructura;
- orden de lectura;
- idioma;
- etiquetas;
- tablas;
- imágenes;
- metadatos;
- navegación;
- tecnologías asistivas;
- legibilidad.

## PDF de impresión

Se evaluará según el contrato específico de producción gráfica, incluyendo los requisitos PDF/X correspondientes.

La conformidad gráfica no sustituirá la accesibilidad.

---

# 28. Evidencia de Auditoría

Cada validación deberá producir evidencia suficiente para reconstruir la decisión.

La evidencia podrá incluir:

- identificador de ejecución;
- versión del código;
- commit;
- hash;
- fecha de ejecución;
- entorno;
- herramienta;
- configuración;
- resultado;
- defectos;
- excepciones;
- capturas cuando sean necesarias;
- registros;
- resultado de pruebas manuales;
- resultado de tecnologías asistivas.

Los resultados deberán poder relacionarse con el artefacto evaluado.

---

# 29. Execution ID

Toda tarea significativa de compilación o validación deberá poder asociarse a un `executionId`.

El identificador permitirá relacionar:

```text
executionId
   ↓
entrada
   ↓
transformaciones
   ↓
validaciones
   ↓
artefactos
   ↓
evidencia
```

La implementación concreta del identificador permanecerá bajo los contratos técnicos correspondientes.

---

# 30. Determinismo y Reproducibilidad

Cuando un proceso se declare determinista, deberá minimizar o neutralizar las fuentes de variación no semántica conocidas.

Se deberán considerar especialmente:

- timestamps;
- PIDs;
- rutas locales;
- identificadores temporales;
- orden no determinista;
- metadatos de entorno;
- configuración;
- versiones de herramientas;
- codificación;
- recursos externos.

La reproducibilidad deberá evaluarse en los entornos definidos por el proyecto:

- Linux Mint;
- Windows 11.

La equivalencia funcional entre entornos tendrá prioridad sobre la identidad binaria cuando diferencias inevitables del formato o plataforma impidan una identidad byte a byte.

---

# 31. Aislamiento de Entorno

El pipeline deberá reducir la contaminación derivada del entorno local.

Los artefactos no deberán incorporar, salvo justificación contractual:

- rutas personales;
- identificadores locales;
- información accidental del sistema;
- timestamps no controlados;
- PIDs;
- datos temporales;
- metadatos irrelevantes.

Las diferencias inevitables deberán documentarse.

---

# 32. Tecnología Editorial

LexDigitalHD podrá utilizar tecnologías profesionales como:

- Adobe InDesign;
- ExtendScript;
- UXP;
- Astro;
- Tailwind CSS;
- herramientas de validación;
- herramientas de generación;
- sistemas de automatización.

La herramienta utilizada nunca será considerada por sí misma evidencia de conformidad.

La conformidad pertenece al artefacto resultante y al proceso de validación.

---

# 33. Integración con InDesign

Cuando InDesign participe en el proceso:

- la semántica no deberá depender exclusivamente de propiedades visuales;
- los estilos deberán corresponder a una estructura editorial definida;
- las transformaciones deberán conservar trazabilidad;
- la exportación deberá poder ser validada;
- los scripts deberán ser deterministas dentro de los límites definidos por el entorno.

La maquetación visual no podrá convertirse en sustituto de la estructura semántica.

---

# 34. Arquitectura Multicanal

El sistema deberá mantener una separación clara entre:

**fuente semántica**

y

**proyecciones de salida.**

La arquitectura deberá permitir que una misma fuente produzca diferentes representaciones:

```text
                    FUENTE SEMÁNTICA
                           │
                    MODELO / AST
                           │
              ┌────────────┼────────────┐
              │            │            │
              ↓            ↓            ↓
             WEB         EPUB          PDF
              │            │            │
            WCAG        EPUB A11Y     PDF/UA
              │            │            │
              └────────────┼────────────┘
                           ↓
                     EVIDENCIA
```

La accesibilidad será una propiedad que deberá ser proyectada y validada por canal, no una propiedad asumida automáticamente por compartir una misma fuente.

---

# 35. Auditoría Externa

Gemini Pro podrá actuar como:

**Auditor técnico independiente y consultivo.**

Su función será:

- revisar el contrato;
- detectar contradicciones;
- identificar riesgos;
- evaluar precisión técnica;
- evaluar precisión normativa;
- señalar omisiones;
- proponer observaciones;
- cuestionar decisiones arquitectónicas.

Gemini Pro:

- no modificará el repositorio;
- no modificará directamente el contrato;
- no podrá convertir un borrador en versión final;
- no tendrá autoridad unilateral de aprobación;
- no sustituirá las pruebas técnicas del proyecto.

Las observaciones serán evaluadas por la autoridad principal del proyecto.

---

# 36. Gobernanza

La autoridad de decisión corresponde al proyecto LexDigitalHD.

El proceso será:

```text
borrador
   ↓
revisión interna
   ↓
auditoría externa
   ↓
observaciones
   ↓
evaluación
   ↓
decisión
   ↓
modificación controlada
   ↓
nueva versión
```

Ninguna observación externa será incorporada automáticamente sin evaluación.

---

# 37. Control de Cambios

Todo cambio que afecte:

- accesibilidad;
- semántica;
- estructura;
- UX;
- rendimiento;
- validación;
- integridad;
- proyección multicanal;

deberá ser trazable.

Los cambios contractuales deberán seguir la política de versiones del proyecto.

`0.1.0-draft` permanecerá como estado de borrador hasta que:

1. finalice la auditoría;
2. se evalúen las observaciones;
3. se incorporen las modificaciones aprobadas;
4. se ejecuten las pruebas correspondientes;
5. el proyecto determine la siguiente versión contractual.

---

# 38. Exclusiones

Este contrato no constituye por sí mismo:

- contrato de contenido jurídico;
- contrato de backend;
- contrato de API pública;
- contrato de infraestructura Cloudflare;
- contrato de base de datos;
- contrato de autenticación;
- contrato de firma digital;
- contrato independiente de Core Web Vitals;
- contrato de producción gráfica;
- especificación completa de cada compilador.

Estos elementos podrán estar regulados por contratos específicos.

---

# 39. Roadmap Inicial

La fase actual corresponde a:

**Consolidación y auditoría de MVP-057-DESIGN-ACCESSIBILITY-CONTRACT v0.1.0-draft.**

El siguiente paso es:

**Auditoría técnica independiente por Gemini Pro.**

Las fases posteriores podrán incluir:

### Expansión del Parser

Incorporación progresiva de dominios:

- científicos;
- matemáticos;
- educativos;
- fichas didácticas;
- EdTech.

### Dashboard de Escritorio

Integración futura de:

- Electron;
- Server-Sent Events;
- monitorización de compilaciones;
- trazabilidad de ejecuciones.

### Certificación de Entorno

Pruebas de regresión sobre:

- Linux Mint;
- Windows 11;

incluyendo validación de hashes terminales y reproducibilidad.

---

# 40. Criterios de Aceptación del MVP-057

El contrato no podrá considerarse listo para cierre hasta que exista evidencia de que:

1. Se ha definido la separación entre requisitos normativos y criterios de calidad.
2. Se ha definido la separación Web / EPUB / PDF.
3. Se ha establecido WCAG 2.2 AA como referencia Web.
4. Se ha definido el papel de WAI-ARIA.
5. Se ha establecido el modelo de accesibilidad desde el AST.
6. Se ha eliminado la correspondencia obligatoria 1:1 entre AST y formatos.
7. Se ha definido el modelo `APTA-TÉCNICA`.
8. Se ha definido el modelo `APTA-PUBLICACIÓN`.
9. Se ha establecido el límite criptográfico de SHA-256.
10. Se ha definido la matriz primaria de tecnologías asistivas.
11. Se ha definido la matriz complementaria.
12. Se ha establecido la prueba obligatoria de zoom 200 %.
13. Se ha establecido la prueba adicional de 400 %.
14. Se ha establecido la evaluación de reflow.
15. Se ha establecido la evaluación de contraste de texto y elementos no textuales.
16. Se ha establecido la navegación por teclado.
17. Se ha establecido la evaluación del foco.
18. Se ha establecido `prefers-reduced-motion`.
19. Se ha incorporado rendimiento como criterio UX sin convertirlo en contrato independiente de Core Web Vitals.
20. Se ha establecido la prohibición de contenido ficticio presentado como jurídico real.
21. Se ha establecido que las herramientas automatizadas no bastan para declarar `APTA-TÉCNICA`.
22. Se ha establecido la necesidad de evidencia.
23. Se ha definido el papel de Gemini Pro como auditor consultivo.
24. Se ha preservado la autoridad de decisión del proyecto.
25. Se ha mantenido el estado contractual `0.1.0-draft`.

---

# 41. Principio Final

LexDigitalHD no considerará accesible un artefacto simplemente porque pueda ser renderizado.

No considerará legible un artefacto simplemente porque sea visualmente atractivo.

No considerará jurídicamente confiable un artefacto simplemente porque tenga un hash.

No considerará una publicación lista para producción simplemente porque haya superado un validador automático.

La condición de calidad deberá surgir de la convergencia de:

```text
SEMÁNTICA
    +
INTEGRIDAD
    +
ACCESIBILIDAD
    +
LEGIBILIDAD
    +
UX
    +
RESPONSIVIDAD
    +
RENDIMIENTO
    +
VALIDACIÓN
    +
EVIDENCIA
    +
INTEGRIDAD EDITORIAL
```

Por tanto:

> **La fuente semántica define el significado.**\
> **Cada canal define su propia representación accesible.**\
> **La validación demuestra el resultado.**\
> **La evidencia permite reconstruir la decisión.**\
> **La publicación solamente se declara apta cuando el contenido y la experiencia están realmente preparados para producción.**

---

## Estado contractual

**MVP-057-DESIGN-ACCESSIBILITY-CONTRACT**\
**Versión:** `0.1.0-draft`\
**Estado:** **LISTO PARA AUDITORÍA TÉCNICA EXTERNA**\
**Implementación:** No iniciada por este contrato\
**Auditor externo previsto:** Gemini Pro\
**Autoridad final:** LexDigitalHD
