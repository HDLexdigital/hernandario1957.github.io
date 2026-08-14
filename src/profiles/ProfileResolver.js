const { validarPerfil } = require('./ProfileLoader');

/**
 * Resuelve la configuración efectiva aplicando la jerarquía de precedencia:
 * CLI flags > Perfil editorial > Valores por defecto.
 * Garantiza inmutabilidad mediante clonación profunda.
 */
function resolverConfiguracion({ defaults = {}, perfil = null, cliFlags = {} } = {}) {
    // 1. Clonación profunda de los defaults
    const configEfectiva = JSON.parse(JSON.stringify(defaults));

    // 2. Si hay perfil, validar y aplicar
    if (perfil !== null && perfil !== undefined) {
        const validacion = validarPerfil(perfil);
        if (!validacion.valid) {
            throw new Error(`Perfil inválido: ${validacion.errors.join(', ')}`);
        }

        if (perfil.settings && typeof perfil.settings === 'object') {
            const settingsClon = JSON.parse(JSON.stringify(perfil.settings));
            Object.assign(configEfectiva, settingsClon);
        }

        if (perfil.semanticOverrides && typeof perfil.semanticOverrides === 'object') {
            configEfectiva.semanticOverrides = JSON.parse(JSON.stringify(perfil.semanticOverrides));
        }
    }

    // 3. Aplicar flags de CLI (precedencia absoluta)
    if (cliFlags && typeof cliFlags === 'object') {
        for (const [key, val] of Object.entries(cliFlags)) {
            if (val !== undefined && val !== null) {
                configEfectiva[key] = typeof val === 'object' ? JSON.parse(JSON.stringify(val)) : val;
            }
        }
    }

    return configEfectiva;
}

module.exports = {
    resolverConfiguracion
};