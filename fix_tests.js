const fs = require('fs');

// 1. Reparar E9 (Inyectar propiedad 'texto' y 'tipo' al AST viejo)
const e9Path = './test/regression/e9.regression.test.js';
if (fs.existsSync(e9Path)) {
    let code = fs.readFileSync(e9Path, 'utf8');
    code = code.replace(/tipoNodo:\s*'paragraph',/g, "tipo: 'parrafo', tipoNodo: 'paragraph', texto: 'Párrafo dummy',");
    code = code.replace(/tipoNodo:\s*'character',/g, "tipo: 'texto', tipoNodo: 'character', texto: 'Span dummy',");
    fs.writeFileSync(e9Path, code, 'utf8');
    console.log('✅ Fixture E9 reparado.');
}

// 2. Reparar E2E (Actualizar fixture al modelo E12 y sanear UTF-8)
const e2ePath = './test/integration/e2e.pipeline.test.js';
if (fs.existsSync(e2ePath)) {
    let code = fs.readFileSync(e2ePath, 'utf8');
    
    // Reemplazamos todo el objeto fixtureJuridico
    const fixture = \const fixtureJuridico = {
        documento: { titulo: 'Código de Procedimiento' },
        contenido: [
            { tipo: 'parrafo', tipoNodo: 'paragraph', estiloParrafo: 'P02_TITLE_PART', claseLegal: 'titulo_parte', texto: 'TÍTULO I.' },
            { tipo: 'parrafo', tipoNodo: 'paragraph', estiloParrafo: 'P02_TITLE_CHAPTER', claseLegal: 'capitulo', texto: 'CAPÍTULO I' },
            { tipo: 'parrafo', tipoNodo: 'paragraph', estiloParrafo: 'P01_BODY_BASE', claseLegal: 'articulo', texto: 'Artículo 1. Finalidad.' },
            { tipo: 'parrafo', tipoNodo: 'paragraph', estiloParrafo: 'P01_BODY_CONT', claseLegal: 'texto_cuerpo', texto: 'Las normas de esta parte.' },
            { tipo: 'parrafo', tipoNodo: 'paragraph', estiloParrafo: 'P01_BODY_CONT', claseLegal: 'paragrafo_normativo', texto: 'Parágrafo 1. Excepciones.' }
        ]
    };\;
    code = code.replace(/const fixtureJuridico = \{[\s\S]*?\]\s*\};/, fixture);
    
    // Saneamos las aserciones que tenían caracteres rotos (TÃTULO -> TÍTULO)
    code = code.replace(/TÃTULO I/g, 'TÍTULO I');
    code = code.replace(/CAPÃTULO I/g, 'CAPÍTULO I');
    code = code.replace(/ArtÃ­culo 1/g, 'Artículo 1');
    code = code.replace(/ParÃ¡grafo 1/g, 'Parágrafo 1');
    code = code.replace(/Las normas de esta parte tienen como finalidad proteger los derechos\./g, 'Las normas de esta parte.');

    fs.writeFileSync(e2ePath, code, 'utf8');
    console.log('✅ Fixture y Aserciones E2E reparados.');
}
