'use strict';
class LexDigitalCompiler {
    constructor(opciones = {}) {
        this.version = '2.0.0';
        this.config = this.cargarConfiguracion(opciones);
        this.modulos = {};
        this.inicializar();
    }
    cargarConfiguracion(opciones) {
        try {
            const configDefault = require('./config/default');
            return { ...configDefault, ...opciones };
        } catch (e) {
            return opciones;
        }
    }
    inicializar() {
        console.log('🚀 LexDigital Compiler v' + this.version);
        // Cargar compilador
        try {
            const compiladorModulo = require('./core/compiladores/compilarLexmotor');
            if (compiladorModulo.compilarLexmotor) {
                this.modulos.compilador = compiladorModulo.compilarLexmotor;
                console.log('  ✅ Compilador cargado');
            }
        } catch (e) {
            console.warn('  ⚠️ Compilador no disponible:', e.message);
        }
        // Cargar constructor
        try {
            const constructorModulo = require('./core/constructores/constructorXHTML');
            this.modulos.constructor = constructorModulo.constructorXHTML || constructorModulo;
            console.log('  ✅ Constructor cargado');
        } catch (e) {
            console.warn('  ⚠️ Constructor no disponible:', e.message);
        }
        // Cargar validador (manejar diferentes formatos)
        try {
            const validadorModulo = require('./core/utils/validadorJson');
            // Si es función directa
            if (typeof validadorModulo === 'function') {
                this.modulos.validadorJson = validadorModulo;
            }
            // Si es objeto con método validar
            else if (validadorModulo.validar) {
                this.modulos.validadorJson = validadorModulo.validar.bind(validadorModulo);
            }
            // Si es objeto con validadorJson
            else if (validadorModulo.validadorJson) {
                this.modulos.validadorJson = validadorModulo.validadorJson;
            }
            // Si es objeto con default
            else if (validadorModulo.default) {
                this.modulos.validadorJson = validadorModulo.default;
            }
            // Si es objeto, usar como está
            else {
                this.modulos.validadorJson = validadorModulo;
            }
            console.log('  ✅ Validador cargado');
        } catch (e) {
            console.warn('  ⚠️ Validador no disponible:', e.message);
        }
        // Cargar clasificador
        try {
            this.modulos.clasificadorLegal = require('./core/utils/clasificadorLegal');
            console.log('  ✅ Clasificador cargado');
        } catch (e) {
            console.warn('  ⚠️ Clasificador no disponible:', e.message);
        }
        console.log('✅ Módulos cargados:', Object.keys(this.modulos).join(', '));
    }
    async compilar(jsonData, opciones = {}) {
        if (!this.modulos.compilador) {
            throw new Error('Compilador no disponible');
        }
        try {
            const resultado = await this.modulos.compilador(jsonData, { ...this.config, ...opciones });
            return resultado;
        } catch (error) {
            throw error;
        }
    }
    validar(jsonData) {
        if (!this.modulos.validadorJson) {
            throw new Error('Validador no disponible');
        }
        // Manejar diferentes tipos de validador
        if (typeof this.modulos.validadorJson === 'function') {
            return this.modulos.validadorJson(jsonData);
        }
        // Si es objeto con método validar
        if (this.modulos.validadorJson.validar) {
            return this.modulos.validadorJson.validar(jsonData);
        }
        // Si es objeto, retornar como está
        return this.modulos.validadorJson;
    }
    clasificar(jsonData) {
        if (!this.modulos.clasificadorLegal) {
            throw new Error('Clasificador no disponible');
        }
        if (typeof this.modulos.clasificadorLegal === 'function') {
            return this.modulos.clasificadorLegal(jsonData);
        }
        return this.modulos.clasificadorLegal;
    }
}
module.exports = {
    Compiler: LexDigitalCompiler,
    compilar: (jsonData, opciones) => new LexDigitalCompiler(opciones).compilar(jsonData),
    validar: (jsonData) => new LexDigitalCompiler().validar(jsonData),
    clasificar: (jsonData) => new LexDigitalCompiler().clasificar(jsonData),
    version: '2.0.0'
};