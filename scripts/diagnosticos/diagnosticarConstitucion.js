'use strict';

const fs = require('fs');
const path = require('path');
const { adaptarInDesign } = require('./src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('./src/compiladores/compilarLexmotor');

async function ejecutarDiagnostico() {
    console.log('🔍 Iniciando diagnóstico profundo de la Constitución...\n');

    const inputJson = path.join(__dirname, 'MisJSON', 'Constitución_Politica_Colombia.json');
    const semanticMapPath = path.join(__dirname, 'estilos', 'Constitución_Politica_Colombia.semantic_map.json');
    const outputDir = path.join(__dirname, 'salidaXHTML');

    if (!fs.existsSync(inputJson) || !fs.existsSync(semanticMapPath)) {
        console.error('❌ Error: No se encuentra el JSON de entrada o su mapa semántico específico.');
        return;
    }

    const jsonCrudo = JSON.parse(fs.readFileSync(inputJson, 'utf8'));
    const semanticMap = JSON.parse(fs.readFileSync(semanticMapPath, 'utf8'));

    // 1. Auditoría de E10 y generación de AST
    const adaptacion = adaptarInDesign({ jsonCrudo, semanticMap });
    
    console.log('--- 1. DIAGNÓSTICO E10 ---');
    console.log('Válido:', adaptacion.diagnostics.valid);
    console.log('Advertencias:', adaptacion.diagnostics.warnings);
    
    const ast = adaptacion.ast;
    console.log('\n--- 2. AUDITORÍA DEL AST ---');
    console.log('Total de nodos en el AST:', ast ? ast.length : 'NULO');

    if (ast && ast.length > 0) {
        // Conteo por tipo ontológico
        const conteoTipos = {};
        ast.forEach(nodo => {
            const tipo = nodo.tipo || 'DESCONOCIDO';
            conteoTipos[tipo] = (conteoTipos[tipo] || 0) + 1;
        });
        console.log('Conteo de nodos por tipo ontológico:', conteoTipos);
        console.log('Primer nodo AST:', JSON.stringify(ast[0], null, 2));
    } else {
        console.error('❌ El AST está completamente vacío.');
        return;
    }

    // 2. Auditoría del Compilador del Núcleo
    console.log('\n--- 3. PRUEBA DE COMPILACIÓN (E1–E9) ---');
    try {
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        
        const mapOutput = path.join(outputDir, 'Constitución_Politica_Colombia.semantic_map.json');
        const profilePath = path.join(outputDir, 'Constitución_Politica_Colombia.profile_map.json');
        fs.writeFileSync(mapOutput, JSON.stringify(adaptacion.semanticMap));
        fs.writeFileSync(profilePath, '{}');

        const resultado = await compilarLexmotor(ast, {
            outputFolder: outputDir,
            semanticMapPath: mapOutput,
            profileStyleMapPath: profilePath
        });

        console.log('XHTML Retornado (Longitud):', resultado && resultado.xhtml ? resultado.xhtml.length : 'VACÍO O NULO');
        if (resultado && resultado.xhtml && resultado.xhtml.length > 0) {
            console.log('Primeros 300 caracteres del XHTML:\n', resultado.xhtml.substring(0, 300));
        } else {
            console.error('❌ compilarLexmotor devolvió un documento XHTML vacío a pesar de tener un AST poblado.');
        }

    } catch (err) {
        console.error('❌ Error crítico durante la ejecución de compilarLexmotor:', err);
    }
}

ejecutarDiagnostico();