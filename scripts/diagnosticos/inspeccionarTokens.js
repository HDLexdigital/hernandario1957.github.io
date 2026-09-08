'use strict';

const fs = require('fs');
const path = require('path');

const inputJson = path.join(__dirname, 'MisJSON', 'Constitución_Politica_Colombia.json');

try {
    let contenidoCrudo = fs.readFileSync(inputJson, 'utf8').replace(/^\uFEFF/, '');
    const jsonCrudo = JSON.parse(contenidoCrudo);

    if (!jsonCrudo.tokens || !Array.isArray(jsonCrudo.tokens)) {
        console.error('❌ El archivo no contiene un arreglo de tokens válido.');
        return;
    }

    console.log(`📊 Total de tokens en la Constitución: ${jsonCrudo.tokens.length}\n`);

    // Agrupar una muestra por cada valor único de 'tipo'
    const muestrasPorTipo = {};
    const tiposUnicos = new Set();

    jsonCrudo.tokens.forEach(token => {
        const t = token.tipo || 'SIN_TIPO';
        tiposUnicos.add(t);
        if (!muestrasPorTipo[t]) {
            muestrasPorTipo[t] = {
                estilo_indesign: token.estilo_indesign,
                texto_muestra: (token.texto_completo || '').substring(0, 60) + '...'
            };
        }
    });

    console.log('--- VALORES ÚNICOS DE "tipo" ENCONTRADOS ---');
    console.log(Array.from(tiposUnicos));

    console.log('\n--- MUESTRA REPRESENTATIVA POR CADA TIPO ---');
    console.log(JSON.stringify(muestrasPorTipo, null, 2));

} catch (err) {
    console.error('❌ Error al inspeccionar los tokens:', err.message);
}