'use strict';
const path = require('path');
const core = require('./core/index');
const cssPurifier = require('./core/utils/cssPurifier');
const { jsonEditorialAdapter } = require('./core/jsonEditorialAdapter');
const BatchProcessor = require('./core/batchProcessor');
const CacheCompilacion = require('./core/cacheCompilacion');

module.exports = {
    version: '2.0.0',
    rootPath: __dirname,
    config: require('./config.json'),
    compilarLexmotor: core.compilarLexmotor,
    validarCompatibilidad: core.validarCompatibilidad,
    PipelineError: core.PipelineError,
    ValidationError: core.ValidationError,
    Logger: core.Logger,
    jsonEditorialAdapter,
    BatchProcessor,
    CacheCompilacion,
    utils: {
        cssPurifier
    }
};