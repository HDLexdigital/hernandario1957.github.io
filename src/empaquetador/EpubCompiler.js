/**
 * @fileoverview src/empaquetador/EpubCompiler.js
 *
 * E15.1 — Orquestador de Integración EPUB (EpubCompiler).
 */

'use strict';

const { prepararEsqueletoEPUB } = require('./EpubPackager');
const { construirOPF } = require('./OpfBuilder');
const { construirNavegacion } = require('./NavBuilder');
const { validarStaging } = require('./EpubValidator');
const { empaquetarEPUB } = require('./EpubPackager');

async function compilarEPUB({
    xhtmlPath,
    cssPath,
    assetsDir = null,
    stagingDir,
    outputPath,
    metadata = {},
    manifestItems = [],
    spineIds = [],
    navigation = []
}) {
    const resultadoContrato = {
        success: false,
        outputPath: null,
        stagingDir,
        validation: {
            valid: false,
            errors: [],
            warnings: []
        },
        package: null
    };

    try {
        if (!stagingDir || typeof stagingDir !== 'string') {
            throw new TypeError('E15.1: stagingDir es obligatorio y debe ser un string.');
        }
        if (!outputPath || typeof outputPath !== 'string') {
            throw new TypeError('E15.1: outputPath es obligatorio y debe ser un string.');
        }

        // ============================================================
        // FASE E14.1 — Preparar esqueleto físico OCF (mimetype, container, xhtml, css)
        // ============================================================
        await prepararEsqueletoEPUB({
            xhtmlPath,
            cssPath,
            assetsDir,
            stagingDir
        });

        // ============================================================
        // FASE E14.3 — Construir Navigation Document (nav.xhtml)
        // * Debe correr ANTES de construir el OPF para que el archivo exista físicamente.
        // ============================================================
        await construirNavegacion({
            stagingDir,
            navItems: navigation
        });

        // ============================================================
        // FASE E14.2 — Construir Package Document (content.opf)
        // ============================================================
        await construirOPF({
            stagingDir,
            metadata,
            manifestItems,
            spineIds
        });

        // ============================================================
        // FASE E14.4 — Auditoría Estructural (Validación previa al ZIP)
        // ============================================================
        const reporteValidacion = await validarStaging(stagingDir);
        resultadoContrato.validation = reporteValidacion;

        if (!reporteValidacion.valid) {
            return resultadoContrato;
        }

        // ============================================================
        // FASE E14.5 — Empaquetamiento Binario ZIP OCF
        // ============================================================
        const resultadoEmpaquetado = await empaquetarEPUB({
            stagingDir,
            outputPath
        });

        resultadoContrato.success = true;
        resultadoContrato.outputPath = resultadoEmpaquetado.outputPath;
        resultadoContrato.package = {
            bytes: resultadoEmpaquetado.bytes,
            entries: resultadoEmpaquetado.entries.length
        };

        return resultadoContrato;

    } catch (error) {
        resultadoContrato.validation.errors.push({
            code: 'E15.1_CRITICAL_EXCEPTION',
            msg: error.message
        });
        return resultadoContrato;
    }
}

module.exports = {
    compilarEPUB
};