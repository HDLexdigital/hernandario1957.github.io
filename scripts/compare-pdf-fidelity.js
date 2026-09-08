'use strict';

const fs = require('fs');

function normalizar(texto, ignorarAcentos = false) {
    let salida = texto
        .split(/\r?\n/)
        .map(linea => linea.trim())
        .filter(linea => {
            if (linea.length === 0) return false;
            // eliminar solo líneas que son exclusivamente un número de página (1-3 dígitos)
            if (/^\d{1,3}$/.test(linea)) return false;
            return true;
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (ignorarAcentos) {
        salida = salida.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    return salida;
}

function main() {
    const args = process.argv.slice(2);
    const ledmPath = args[0] || '/tmp/ledm-full.json';
    const pdfTextPath = args[1] || '/tmp/weasy-text.txt';
    const ignorarAcentos = args.includes('--ignore-accents');

    if (!fs.existsSync(ledmPath) || !fs.existsSync(pdfTextPath)) {
        console.error('❌ Archivos de entrada no encontrados.');
        console.error('Uso: node scripts/compare-pdf-fidelity.js <ledm.json> <texto.txt> [--ignore-accents]');
        process.exit(1);
    }

    const ledm = JSON.parse(fs.readFileSync(ledmPath, 'utf8'));
    const { extractNodeText } = require('../core/compiler/src/semanticCompiler');

    const textoLedmRaw = ledm.structure.blocks.map(b => extractNodeText(b)).join(' ');
    const textoPdfRaw = fs.readFileSync(pdfTextPath, 'utf8');

    const textoLedm = normalizar(textoLedmRaw, ignorarAcentos);
    const textoPdf = normalizar(textoPdfRaw, ignorarAcentos);

    console.log('--- Comparador de fidelidad normalizado ---');
    console.log(`Ignorar acentos: ${ignorarAcentos}`);
    console.log(`LEDM length: ${textoLedm.length}`);
    console.log(`PDF  length: ${textoPdf.length}`);

    const coincide = textoPdf === textoLedm;
    console.log(`¿Coincidencia exacta tras normalizar? ${coincide ? 'SÍ' : 'NO'}`);

    if (!coincide) {
        const minLen = Math.min(textoLedm.length, textoPdf.length);
        let pos = 0;
        while (pos < minLen && textoLedm[pos] === textoPdf[pos]) pos++;
        console.log(`Primer desajuste en posición ${pos}`);
        console.log('LEDM:', textoLedm.slice(pos, pos + 100));
        console.log('PDF :', textoPdf.slice(pos, pos + 100));
    }

    if (textoPdf.includes(textoLedm)) {
        console.log('✅ El PDF contiene el texto LEDM completo (modo inclusión).');
    } else {
        console.log('⚠️ El PDF no contiene el texto LEDM completo de forma continua.');
    }

    process.exit(coincide ? 0 : 1);
}

main();