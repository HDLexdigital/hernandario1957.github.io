# 🏗️ Arquitectura del Sistema LexDigital
## Visión General
LexDigital es un sistema de compilación editorial que transforma documentos legales desde Adobe InDesign a formatos digitales accesibles.
## Componentes Principales
### 1. Plugin UXP (lexmotor-uxp-plugin)
**Responsabilidad:** Extraer contenido estructurado desde InDesign
**Características:**
- Extracción AST (Abstract Syntax Tree)
- Generación de Mapa Semántico
- Carga de CSS Canónico
- Heartbeat IPC para comunicación
**Ubicación:** \lexmotor-uxp-plugin/\
### 2. Pipeline Node.js (LexDigital-Pipeline)
**Responsabilidad:** Procesar documentos extraídos
**Características:**
- Servidor HTTP (puerto 8765)
- Watchdog IPC para comunicación con UXP
- Procesamiento por lotes
**Ubicación:** \LexDigital-Pipeline/\
### 3. Compilador Modular (src/core)
**Responsabilidad:** Compilar JSON a XHTML
**Módulos:**
- \compiladores/\ - Motor de compilación principal
- \constructores/\ - Generación de XHTML
- \utils/\ - Utilidades compartidas
- \alidators/\ - Validación de documentos
**Ubicación:** \src/core/\
## Flujo de Datos
\\\
1. InDesign → Plugin UXP extrae contenido
2. Plugin UXP → Escribe JSON en IPC
3. Watchdog detecta archivo IPC
4. Pipeline procesa JSON
5. Compilador genera XHTML
6. Validador verifica XHTML
7. Resultado se guarda en publicaciones/
\\\
## Protocolo IPC
### Heartbeat
- **Intervalo:** 3 segundos
- **Ubicación:** \~/.lexdigital/active-ipc-root.json\
### Requests
- **Formato:** \equest-{id}.json\
- **Ubicación:** \ipc/requests/\
### Responses
- **Formato:** \esponse-{id}.json\
- **Ubicación:** \ipc/responses/\
## Decisiones de Diseño
### 1. Arquitectura Modular
Cada módulo tiene responsabilidad única y puede evolucionar independientemente.
### 2. IPC por Archivos
Comunicación robusta entre UXP y Node.js sin dependencias de red.
### 3. Validación por Capas
Validadores E18-E26 para diferentes aspectos del documento.
### 4. Compatibilidad
Soporte para versiones anteriores del formato JSON.
## Métricas de Rendimiento
| Métrica | Valor |
|---------|-------|
| Tiempo de compilación | ~2s |
| Documentos procesados | Ilimitado |
| Tamaño máximo | Sin límite |
| Tests | 10 esenciales |
## Seguridad
- Validación de entrada
- Escape de caracteres especiales
- Manejo de errores robusto
- Logging de operaciones