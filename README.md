# 🚀 LexDigital Compiler
**Sistema de compilación editorial para documentos legales colombianos**
## 📖 Descripción
LexDigital es un compilador editorial avanzado que transforma documentos de Adobe InDesign (a través de plugin UXP) en formatos digitales accesibles:
- **XHTML** con accesibilidad ARIA WCAG 2.1
- **EPUB3** para publicación digital
- **PDF/UA** para documentos accesibles
## 🏗️ Arquitectura
\\\
┌─────────────────────────────────────────────────────────┐
│                   ADOBE INDESIGN                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │         PLUGIN UXP (LexMotor)                   │   │
│  │  • Extracción AST                               │   │
│  │  • Mapa Semántico                               │   │
│  │  • CSS Canónico                                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
                    IPC por Archivos
                            ↓
┌─────────────────────────────────────────────────────────┐
│              LEXDIGITAL PIPELINE                       │
│  • Servidor HTTP (puerto 8765)                         │
│  • Watchdog IPC                                        │
│  • Compilador Modular                                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   OUTPUT                                │
│  • XHTML validado                                      │
│  • EPUB3 empaquetado                                   │
│  • Métricas y logs                                     │
└─────────────────────────────────────────────────────────┘
\\\
## 📦 Instalación
### Requisitos
- **Node.js** >= 14.0.0
- **Adobe InDesign** >= 21.0
- **Windows 10/11** (o macOS)
### Instalación
\\\ash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]
# Entrar al directorio
cd proyecto-lexdigital_modular
# Instalar dependencias
npm install
\\\
## 🚀 Uso Rápido
### 1. Compilar un documento
\\\javascript
const lexdigital = require('./src');
// Documento de ejemplo
const documento = {
    titulo: 'Constitución Política de Colombia',
    contenido: [
        { tipo: 'titulo', texto: 'Artículo 1' },
        { tipo: 'parrafo', texto: 'Colombia es un Estado social de derecho...' }
    ]
};
// Compilar
const resultado = await lexdigital.compilar(documento, {
    validar: true,
    generarTOC: true,
    nivelAccesibilidad: 'AA'
});
console.log(resultado);
\\\
### 2. Validar un documento
\\\javascript
const lexdigital = require('./src');
const validacion = lexdigital.validar(documento);
console.log(validacion);
\\\
### 3. Clasificar contenido jurídico
\\\javascript
const lexdigital = require('./src');
const clasificacion = lexdigital.clasificar(documento);
console.log(clasificacion);
\\\
## 📂 Estructura del Proyecto
\\\
proyecto-lexdigital_modular/
├── src/
│   ├── core/
│   │   ├── compiladores/       # Motor de compilación
│   │   ├── constructores/      # Constructores XHTML
│   │   ├── utils/              # Utilidades
│   │   ├── validators/         # Validadores
│   │   └── ports/              # Puertos (interfaces)
│   ├── adaptadores/            # Adaptadores (InDesign, CSS)
│   ├── uxp/                    # Integración UXP
│   ├── config/                 # Configuración
│   └── index.js                # API principal
├── lexmotor-uxp-plugin/        # Plugin UXP para InDesign
├── LexDigital-Pipeline/        # Pipeline Node.js
├── test/
│   ├── core/                   # Tests esenciales
│   └── archive/                # Tests archivados
├── publicaciones/              # Documentos de entrada
├── docs/                       # Documentación
└── package.json
\\\
## 🧪 Testing
\\\ash
# Ejecutar tests esenciales
npm test
# Ejecutar tests de unidad
npm run test:unit
# Ejecutar tests de integración
npm run test:integration
# Verificar estructura
npm run verify
\\\
## 🔧 Configuración
### Archivo de configuración: \src/config/default.js\
\\\javascript
module.exports = {
    paths: {
        input: './publicaciones',
        output: './salidaXHTML',
        logs: './logs'
    },
    compilacion: {
        formato: 'xhtml',
        validar: true,
        nivelAccesibilidad: 'AA'
    }
};
\\\
## 📊 API Reference
### \lexdigital.compilar(documento, opciones)\
Compila un documento a XHTML.
**Parámetros:**
- \documento\ (Object): Documento estructurado
- \opciones\ (Object): Opciones de compilación
**Retorna:** Promise<Object> con el resultado
### \lexdigital.validar(documento)\
Valida la estructura de un documento.
**Parámetros:**
- \documento\ (Object): Documento a validar
**Retorna:** Object con resultado de validación
### \lexdigital.clasificar(documento)\
Clasifica contenido jurídico del documento.
**Parámetros:**
- \documento\ (Object): Documento a clasificar
**Retorna:** Object con clasificación
## 🛠️ Scripts Disponibles
| Comando | Descripción |
|---------|-------------|
| \
pm start\ | Inicia el compilador |
| \
pm test\ | Ejecuta tests esenciales |
| \
pm run test:unit\ | Tests de unidad |
| \
pm run test:integration\ | Tests de integración |
| \
pm run pipeline\ | Inicia el pipeline |
| \
pm run verify\ | Verifica estructura |
## 📝 Documentación Adicional
- [Arquitectura Detallada](docs/ARQUITECTURA.md)
- [API Reference](docs/API.md)
- [Guía de Contribución](docs/CONTRIBUTING.md)
- [Changelog](docs/CHANGELOG.md)
## 🤝 Contribución
1. Fork el repositorio
2. Crea una rama (\git checkout -b feature/nueva-funcionalidad\)
3. Commit tus cambios (\git commit -m 'Agregar funcionalidad'\)
4. Push a la rama (\git push origin feature/nueva-funcionalidad\)
5. Abre un Pull Request
## 📄 Licencia
Este proyecto es propiedad de LexDigital. Todos los derechos reservados.
## 🎯 Estado del Proyecto
- ✅ **Fase 1:** Limpieza de código
- ✅ **Fase 2:** Consolidación de módulos
- ✅ **Fase 3:** Optimización de tests
- ✅ **Fase 4:** Documentación
- 🔄 **Fase 5:** Automatización
## 📞 Soporte
Para soporte, contactar al equipo de desarrollo de LexDigital.
---
**Versión:** 2.0.0  
**Última actualización:** 2026-08-23