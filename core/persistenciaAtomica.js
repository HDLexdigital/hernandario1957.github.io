// src/core/persistenciaAtomica.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class PersistenciaAtomica {
    constructor(directorio) {
        this.directorio = directorio;
    }
    
    guardarAtomico(nombre, contenido) {
        const archivoTemp = path.join(this.directorio, `${nombre}.tmp`);
        const archivoFinal = path.join(this.directorio, nombre);
        
        // Escribir archivo temporal
        fs.writeFileSync(archivoTemp, contenido, 'utf8');
        
        // Calcular hash
        const hash = crypto
            .createHash('sha256')
            .update(contenido)
            .digest('hex');
        
        // Renombrar atómicamente
        fs.renameSync(archivoTemp, archivoFinal);
        
        return hash;
    }
}

module.exports = PersistenciaAtomica;