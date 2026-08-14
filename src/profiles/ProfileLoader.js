const fs = require('fs');

/**
 * Valida que un objeto cumpla estrictamente con el contrato del perfil editorial.
 * @param {Object} perfil - Objeto a validar.
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validarPerfil(perfil) {
    const errors = [];

    if (!perfil || typeof perfil !== 'object' || Array.isArray(perfil)) {
        return { valid: false, errors: ['El perfil debe ser un objeto estructurado válido.'] };
    }

    // Validación estricta de 'name'
    if (perfil.name === undefined) {
        errors.push("El campo obligatorio 'name' está ausente.");
    } else if (typeof perfil.name !== 'string') {
        errors.push("El campo 'name' debe ser de tipo string.");
    }

    // Validación estricta de 'settings'
    if (perfil.settings === undefined) {
        errors.push("El campo obligatorio 'settings' está ausente.");
    } else if (typeof perfil.settings !== 'object' || perfil.settings === null || Array.isArray(perfil.settings)) {
        errors.push("El campo 'settings' debe ser un objeto válido.");
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Lee, parsea, valida y retorna una copia profunda independiente de un archivo de perfil editorial.
 * @param {string} ruta - Ruta absoluta o relativa al archivo JSON del perfil.
 * @returns {Object} Objeto de perfil validado y clonado.
 * @throws {Error} Si el archivo no existe, el JSON está corrupto o el perfil es inválido.
 */
function cargarPerfil(ruta) {
    if (!fs.existsSync(ruta)) {
        throw new Error(`El archivo de perfil especificado no existe: ${ruta}`);
    }

    let contenidoCrudo;
    let perfilObj;

    try {
        contenidoCrudo = fs.readFileSync(ruta, 'utf8');
        perfilObj = JSON.parse(contenidoCrudo);
    } catch (parseErr) {
        throw new Error(`Error de sintaxis o lectura al parsear el perfil JSON: ${parseErr.message}`);
    }

    const resultadoValidacion = validarPerfil(perfilObj);
    if (!resultadoValidacion.valid) {
        throw new Error(`El perfil editorial no cumple con el contrato estructural: ${resultadoValidacion.errors.join(', ')}`);
    }

    // Retorna una copia profunda independiente para garantizar inmutabilidad periférica
    return JSON.parse(JSON.stringify(perfilObj));
}

module.exports = {
    validarPerfil,
    cargarPerfil
};