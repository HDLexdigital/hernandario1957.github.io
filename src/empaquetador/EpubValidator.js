/**
 * @fileoverview src/empaquetador/EpubValidator.js
 *
 * E14.4 — Validador estructural OCF y EPUB3 (Auditor de solo lectura).
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

/**
 * Valida de forma estricta y segura que una ruta href no escape de OEBPS.
 */
function validarHrefSeguro(href) {
    if (!href || typeof href !== 'string' || href.trim() === '') {
        return { valido: false, codigo: 'E14.4_EMPTY_HREF' };
    }

    const trimmed = href.trim();

    // Rechazar esquemas absolutos o protocolos externos
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) || trimmed.startsWith('data:')) {
        return { valido: false, codigo: 'E14.4_ABSOLUTE_HREF' };
    }

    // Normalizar usando POSIX para evitar evasiones por separadores de plataforma (\ vs /)
    const normalized = path.posix.normalize(trimmed);

    // Rechazar si intenta salir del directorio OEBPS
    if (normalized.startsWith('../') || normalized === '..' || path.posix.isAbsolute(normalized)) {
        return { valido: false, codigo: 'E14.4_PATH_TRAVERSAL' };
    }

    return { valido: true, normalized };
}

/**
 * Realiza una auditoría completa del staging OCF sin mutar ningún archivo.
 */
async function validarStaging(stagingDir) {
    const report = {
        valid: false,
        errors: [],
        warnings: [],
        manifest: { declared: 0, existing: 0, orphaned: 0 },
        spine: { items: 0 },
        navigation: null
    };

    if (!stagingDir || typeof stagingDir !== 'string') {
        report.errors.push({ code: 'E14.4_INVALID_STAGING_DIR', msg: 'stagingDir no es una ruta válida.' });
        return report;
    }

    try {
        // 1. Validar Mimetype
        const mimetypePath = path.join(stagingDir, 'mimetype');
        let mimetype = '';
        try {
            mimetype = await fs.readFile(mimetypePath, 'utf8');
        } catch {
            report.errors.push({ code: 'E14.4_MISSING_MIMETYPE', msg: 'El archivo mimetype es obligatorio en la raíz.' });
            return report;
        }

        if (mimetype !== 'application/epub+zip') {
            report.errors.push({ code: 'E14.4_INVALID_MIMETYPE', msg: 'El contenido de mimetype debe ser exactamente application/epub+zip.' });
        }
        if (mimetype.includes('\n') || mimetype.includes('\r')) {
            report.errors.push({ code: 'E14.4_MIMETYPE_LF', msg: 'El archivo mimetype no debe contener saltos de línea (CR/LF).' });
        }

        // 2. Validar META-INF/container.xml
        const containerPath = path.join(stagingDir, 'META-INF', 'container.xml');
        let containerXml = '';
        try {
            containerXml = await fs.readFile(containerPath, 'utf8');
        } catch {
            report.errors.push({ code: 'E14.4_MISSING_CONTAINER', msg: 'Falta el archivo META-INF/container.xml.' });
            return report;
        }

        if (!containerXml.includes('full-path="OEBPS/content.opf"')) {
            report.errors.push({ code: 'E14.4_INVALID_CONTAINER', msg: 'container.xml no apunta correctamente a OEBPS/content.opf.' });
        }

        // 3. Validar OEBPS/content.opf
        const opfPath = path.join(stagingDir, 'OEBPS', 'content.opf');
        let opfXml = '';
        try {
            opfXml = await fs.readFile(opfPath, 'utf8');
        } catch {
            report.errors.push({ code: 'E14.4_MISSING_OPF', msg: 'El documento OPF (OEBPS/content.opf) no existe físicamente.' });
            return report;
        }

        let doc;
        try {
            doc = new DOMParser().parseFromString(opfXml, 'text/xml');
            // Verificar errores fatales de parseo XML en el DOM
            const parseError = doc.getElementsByTagName('parsererror');
            if (parseError && parseError.length > 0) {
                throw new Error('XML mal formado detectado por el parser.');
            }
        } catch (e) {
            report.errors.push({ code: 'E14.4_MALFORMED_OPF', msg: `El OPF contiene XML inválido o mal formado: ${e.message}` });
            return report;
        }

        const items = Array.from(doc.getElementsByTagName('item'));
        if (items.length === 0) {
            report.errors.push({ code: 'E14.4_EMPTY_MANIFEST', msg: 'El manifest del OPF está vacío.' });
            return report;
        }

        const manifestIds = new Set();
        report.manifest.declared = items.length;
        let navCount = 0;

        for (const item of items) {
            const id = item.getAttribute('id');
            const href = item.getAttribute('href');
            const mediaType = item.getAttribute('media-type');
            const properties = item.getAttribute('properties');

            if (!id || !href || !mediaType) {
                report.errors.push({ code: 'E14.4_INCOMPLETE_MANIFEST_ITEM', msg: `Item de manifest incompleto (id/href/media-type requeridos).` });
                continue;
            }

            if (manifestIds.has(id)) {
                report.errors.push({ code: 'E14.4_DUP_ID', href: id, msg: `ID duplicado en el manifest: ${id}` });
            }
            manifestIds.add(id);

            // Validar seguridad de href contra path traversal
            const validacionHref = validarHrefSeguro(href);
            if (!validacionHref.valido) {
                report.errors.push({ code: validacionHref.codigo, href, msg: `Ruta href inválida o peligrosa: ${href}` });
                continue;
            }

            // Validar existencia física del recurso
            const rutaFisica = path.join(stagingDir, 'OEBPS', validacionHref.normalized);
            try {
                const stat = await fs.stat(rutaFisica);
                if (!stat.isFile()) throw new Error();
                report.manifest.existing++;
            } catch {
                report.errors.push({ code: 'E14.4_MISSING_RESOURCE', href, msg: `El recurso declarado no existe físicamente: ${href}` });
            }

            // Validar propiedades de navegación (nav)
            if (properties && properties.split(/\s+/).includes('nav')) {
                navCount++;
                report.navigation = { id, href };
            }
        }

        // 4. Validar Spine
        const refs = Array.from(doc.getElementsByTagName('itemref'));
        report.spine.items = refs.length;
        for (const ref of refs) {
            const idref = ref.getAttribute('idref');
            if (!idref || !manifestIds.has(idref)) {
                report.errors.push({ code: 'E14.4_SPINE_FANTASMA', idref, msg: `El spine referencia un idref inexistente: ${idref}` });
            }
        }

        // Advertencia opcional si hay múltiples o ningún elemento de navegación principal
        if (navCount === 0) {
            report.warnings.push({ code: 'E14.4_MISSING_NAV_PROPERTY', msg: 'No se declaró ningún ítem con properties="nav" en el manifest.' });
        } else if (navCount > 1) {
            report.warnings.push({ code: 'E14.4_MULTIPLE_NAV_PROPERTIES', msg: 'Se declararon múltiples ítems con properties="nav". Se recomienda solo uno.' });
        }

    } catch (e) {
        report.errors.push({ code: 'E14.4_CRITICAL_SYSTEM', msg: `Error crítico durante la validación: ${e.message}` });
    }

    report.valid = report.errors.length === 0;
    return report;
}

module.exports = { validarStaging };