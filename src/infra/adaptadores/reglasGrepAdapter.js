'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Adaptador de Infraestructura: Carga de Reglas GREP (C.50.6)
 * Lee el archivo de texto exportado por InDesign y lo transforma en un 
 * array de reglas estructuradas en memoria para el Core.
 */
class ReglasGrepAdapter {
    /**
     * Carga y parsea las reglas dinámicas desde el filesystem.
     * 
     * @param {string} [rutaPersonalizada] - Ruta opcional al archivo .txt de reglas.
     * @returns {Array<Object>} Array de reglas parseadas listas para el motor.
     */
    static cargarDesdeFilesystem(rutaPersonalizada) {
        const rutaTxt = rutaPersonalizada || path.join(__dirname, '../../config/ReglasGrepJuridicas.txt');
        let reglasDinamicas = [];

        if (fs.existsSync(rutaTxt)) {
            try {
                const contenido = fs.readFileSync(rutaTxt, 'utf-8');
                const lineas = contenido.split(/\r?\n/);

                lineas.forEach(linea => {
                    if (linea.trim() !== '') {
                        const partes = linea.split('|');
                        if (partes.length === 2) {
                            const tipoExtraido = partes[0].replace('TIPO:', '').trim();
                            let patronTexto = partes[1].replace('PATRON:', '').trim();

                            let flags = '';
                            if (patronTexto.endsWith('/i')) {
                                flags = 'i';
                                patronTexto = patronTexto.slice(1, -2);
                            } else if (patronTexto.startsWith('/') && patronTexto.endsWith('/')) {
                                patronTexto = patronTexto.slice(1, -1);
                            }

                            reglasDinamicas.push({
                                patron: new RegExp(patronTexto, flags),
                                tipo: tipoExtraido,
                                epubType: 'notice',
                                nivelHtml: 6
                            });
                        }
                    }
                });
            } catch (e) {
                console.warn('⚠️ Advertencia al leer reglas dinámicas de infraestructura:', e.message);
            }
        }

        return reglasDinamicas;
    }
}

module.exports = {
    ReglasGrepAdapter
};