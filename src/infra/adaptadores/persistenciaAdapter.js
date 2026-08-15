'use strict';

const fs = require('fs');
const path = require('path');
const { PersistenciaArtefactoPort } = require('../../core/ports/persistenciaArtefacto');

class PersistenciaAdapter extends PersistenciaArtefactoPort {
    guardar(artefacto, rutaDestino) {
        if (!artefacto || typeof artefacto !== 'object') {
            throw new Error('ERR_INVALID_ARTEFACTO: Se requiere un artefacto canónico C.46 válido.');
        }
        if (!rutaDestino || typeof rutaDestino !== 'string') {
            throw new Error('ERR_INVALID_DESTINATION: Se requiere una ruta de destino válida.');
        }

        if (!fs.existsSync(rutaDestino)) {
            fs.mkdirSync(rutaDestino, { recursive: true });
        }

        const nombreBase = (artefacto.metadatos && artefacto.metadatos.nombre) || 'documento_lexdigital';

        const rutaXhtml = path.resolve(rutaDestino, `${nombreBase}.xhtml`);
        const rutaJson = path.resolve(rutaDestino, `${nombreBase}.json`);
        const rutaMeta = path.resolve(rutaDestino, `${nombreBase}_metadatos.json`);

        fs.writeFileSync(rutaXhtml, artefacto.xhtml, 'utf8');
        fs.writeFileSync(rutaJson, JSON.stringify(artefacto.jsonOficial, null, 2), 'utf8');
        fs.writeFileSync(rutaMeta, JSON.stringify(artefacto.metadatos, null, 2), 'utf8');

        return {
            exito: true,
            archivos: {
                xhtml: rutaXhtml,
                jsonOficial: rutaJson,
                metadatos: rutaMeta
            }
        };
    }
}

module.exports = {
    PersistenciaAdapter
};