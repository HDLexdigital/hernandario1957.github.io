# 🤝 Guía de Contribución
## Cómo Contribuir
### 1. Reportar Bugs
- Usa el template de issues
- Incluye pasos para reproducir
- Adjunta logs relevantes
### 2. Sugerir Mejoras
- Describe la mejora propuesta
- Explica el beneficio
- Proporciona ejemplos si es posible
### 3. Enviar Pull Requests
1. Fork el repositorio
2. Crea una rama: \git checkout -b feature/mi-mejora\
3. Haz commit: \git commit -m 'Agregar mejora'\
4. Push: \git push origin feature/mi-mejora\
5. Abre un Pull Request
## Estándares de Código
### JavaScript
- Usar \const\ y \let\ (no \ar\)
- Arrow functions cuando sea posible
- Template literals para strings
- Async/await sobre callbacks
### Nombres
- Variables: \camelCase\
- Clases: \PascalCase\
- Constantes: \UPPER_SNAKE_CASE\
- Archivos: \kebab-case.js\
### Estructura de Archivos
\\\javascript
'use strict';
// Imports
const modulo = require('./modulo');
// Clase o función principal
class MiModulo {
    constructor() {
        // Inicialización
    }
    metodo() {
        // Implementación
    }
}
// Exportación
module.exports = MiModulo;
\\\
## Testing
- Cada módulo nuevo debe tener tests
- Ejecutar \
pm test\ antes de commit
- Mantener tests rápidos (< 5s)
## Documentación
- Documentar funciones públicas
- Actualizar README.md si es necesario
- Agregar ejemplos de uso
## Proceso de Review
1. CI debe pasar
2. Code review por mantenedor
3. Tests de integración
4. Aprobación final