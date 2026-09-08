'use strict';

const fs = require('fs');
const { execFileSync } = require('child_process');

const PDF_INPUT = process.argv[2] || 'output/experiment-weasyprint-ua-full.pdf';

function buscarJar() {
    const raices = [
        '/var/lib/flatpak/app/org.verapdf.veraPDF/x86_64/stable',
        process.env.HOME + '/verapdf'
    ];

    for (const raiz of raices) {
        try {
            const resultado = execFileSync(
                'find',
                [raiz, '-name', 'cli-*.jar'],
                { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
            ).trim();
            if (resultado) {
                const lineas = resultado.split('\n');
                if (lineas[0]) return lineas[0];
            }
        } catch {}
    }

    throw new Error('No se encontró el CLI de veraPDF (cli-*.jar)');
}

function validarPdf(pdfPath, jarPath) {
    console.log('🔍 Validando PDF/UA-1 con veraPDF...');
    execFileSync(
        'java',
        ['-jar', jarPath, '--format', 'text', '--flavour', 'ua1', '--verbose', pdfPath],
        { stdio: 'inherit' }
    );
    return true; // solo llega aquí si no hubo excepción
}

function main() {
    if (!fs.existsSync(PDF_INPUT)) {
        console.error(`❌ PDF no encontrado: ${PDF_INPUT}`);
        process.exit(1);
    }

    const jarPath = buscarJar();
    console.log(`✅ veraPDF CLI encontrado: ${jarPath}`);

    try {
        validarPdf(PDF_INPUT, jarPath);
        console.log('✅ PDF/UA-1 PASS');
        process.exit(0);
    } catch (error) {
        console.error('❌ PDF/UA-1 FAIL');
        process.exit(1);
    }
}

main();