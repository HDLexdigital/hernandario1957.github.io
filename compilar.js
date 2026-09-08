'use strict';

const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
const archiver = require('archiver');

// ============================================================================
// TELEMETRÍA
// ============================================================================
const Telemetria = require('./utils/telemetria');
const telemetria = new Telemetria();

// ============================================================================
// DEPENDENCIAS INDUSTRIALES INTERNAS
// ============================================================================
const { adaptarInDesign } = require('./src/adaptadores/InDesignAdapter');
const { evaluarTokenConGrep } = require('./src/core/motorGrepJuridico');
const { construirEstructura } = require('./src/core/constructorXHTML');
const TocGenerator = require('./src/core/constructores/TocGenerator');
const { insertarNotasEnHtml } = require('./src/core/constructores/constructorNotas');

// ============================================================================
// CONFIGURACIÓN DE DIRECTORIOS
// ============================================================================
const RAIZ = __dirname;
const PUBLICACIONES = path.join(RAIZ, 'publicaciones');
const MIS_JSON = path.join(RAIZ, 'MisJSON');
const ESTILOS = path.join(RAIZ, 'Estilos');

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================
function purificarAST(obj) {
    if (typeof obj === 'string') {
        return obj.replace(/\uFEFF/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    } else if (Array.isArray(obj)) {
        return obj.map(purificarAST);
    } else if (obj !== null && typeof obj === 'object') {
        const objLimpio = {};
        for (const clave in obj) {
            const claveLimpia = clave.replace(/\uFEFF/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
            objLimpio[claveLimpia] = purificarAST(obj[clave]);
        }
        return objLimpio;
    }
    return obj;
}

function slugify(texto) {
    return String(texto)
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]+/g, '_')
        .replace(/_+/g, '_');
}

// ============================================================================
// LIMPIEZA DE TEXTO
// ============================================================================
function limpiarTexto(texto) {
    if (texto === undefined || texto === null || texto === 'undefined') return '';
    let limpio = String(texto)
        .replace(/\uFEFF/g, '')
        .replace(/\r?\n/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();

    limpio = limpio.replace(/^(.+?)\s*\(\s*\1\s*\)\s*(.*)$/, '$1 $2');
    limpio = limpio.replace(/^(.+?)\.\s*\(\s*\1\s*\)\s*(.*)$/, '$1 $2');
    limpio = limpio.replace(/^(.+?)\(\)\s*\1\s*(.*)$/, '$1 $2');

    return limpio.replace(/[ \t]+/g, ' ').trim();
}

// ============================================================================
// PARSEO SEGURO DE JSON (elimina caracteres de control crudos)
// ============================================================================
function parsearJSONSeguro(contenido) {
    let limpio = contenido
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')  // control chars
        .replace(/\t/g, ' ')      // tabs
        .replace(/\r?\n/g, ' ')   // saltos de línea crudos
        .replace(/ {2,}/g, ' ');  // múltiples espacios
    return JSON.parse(limpio);
}

// ============================================================================
// EXTRACCIÓN ROBUSTA DE PÁRRAFOS (fallback si no existe AST enriquecido)
// ============================================================================
function extraerParrafos(ast) {
    if (!ast) return [];

    if (Array.isArray(ast)) {
        if (ast.length > 0 && ast[0]?.type === 'story' && Array.isArray(ast[0].children)) {
            let planos = [];
            ast.forEach(story => {
                if (story.children && Array.isArray(story.children)) {
                    planos = planos.concat(story.children);
                }
            });
            return planos;
        }
        return ast;
    }

    const clavesDirectas = ['contenido', 'parrafos', 'nodos', 'paragraphs', 'elements'];
    for (const clave of clavesDirectas) {
        if (Array.isArray(ast[clave])) return ast[clave];
    }

    if (ast.stories && Array.isArray(ast.stories)) {
        let planos = [];
        ast.stories.forEach(st => {
            if (st.children && Array.isArray(st.children)) {
                planos = planos.concat(st.children);
            }
        });
        return planos;
    }

    if (ast.body && ast.body.stories && Array.isArray(ast.body.stories)) {
        let planos = [];
        ast.body.stories.forEach(st => {
            if (st.children && Array.isArray(st.children)) {
                planos = planos.concat(st.children);
            }
        });
        return planos;
    }

    if (ast.body && Array.isArray(ast.body)) return ast.body;
    if (ast.children && Array.isArray(ast.children)) return ast.children;

    return [];
}

// ============================================================================
// BÚSQUEDA DE AST (prioriza enriquecido)
// ============================================================================
function buscarAST(nombre) {
    const candidatos = [
        `${nombre}_ast_enriquecido.json`,
        `${nombre}.ast_enriquecido.json`,
        `${nombre}_ast.json`,
        `${nombre}.indd.json`,
        `${nombre}.json`,
        `${nombre}_contenido.json`,
        `${nombre}_extraido.json`,
        `${nombre}_estructura.json`,
        `${nombre}_estilos.json`,
        `${nombre}_semantic_map.json`
    ];

    for (const candidato of candidatos) {
        const ruta = path.join(MIS_JSON, candidato);
        if (fs.existsSync(ruta)) return ruta;
    }

    console.error(`\n❌ No se encontró el AST para "${nombre}".`);
    console.error(`   Archivos disponibles en MisJSON:`);
    if (fs.existsSync(MIS_JSON)) {
        const archivos = fs.readdirSync(MIS_JSON);
        if (archivos.length === 0) {
            console.error(`   (ninguno)`);
        } else {
            archivos.forEach(a => console.error(`   - ${a}`));
        }
    } else {
        console.error(`   La carpeta MisJSON no existe.`);
    }
    process.exit(1);
}

// ============================================================================
// NORMALIZACIÓN DE PÁRRAFOS ENRIQUECIDOS
// ============================================================================
function normalizarParrafosEnriquecidos(ast) {
    const cuerpo = ast?.cuerpoObra || [];
    const parrafos = [];

    cuerpo.forEach((nodo, index) => {
        const meta = nodo.metadatosExportacion || {};
        const texto = limpiarTexto(nodo.texto || '');

        if (!texto) return;

        const parrafo = {
            nodeId: nodo.nodeId || `parrafo-${index}`,
            texto,
            tipo: meta.exportTag || 'p',
            etiquetaHtml: meta.exportTag || 'p',
            claseLegal: meta.exportClass || 'parrafo',
            ariaRole: meta.ariaRole || null,
            ariaLevel: meta.ariaLevel || null,
            epubType: meta.epubType || '',
            pdfTag: meta.pdfTag || 'P',
            inDesignStyle: nodo.estiloInDesign || '',
            children: Array.isArray(nodo.children) ? nodo.children.map(hijo => ({
                texto: limpiarTexto(hijo.texto || ''),
                estiloCaracter: hijo.estiloCaracter || '',
                exportTag: hijo.metadatosExportacion?.exportTag || 'span',
                exportClass: hijo.metadatosExportacion?.exportClass || '',
                ariaRole: hijo.metadatosExportacion?.ariaRole || null,
                ariaLevel: hijo.metadatosExportacion?.ariaLevel || null,
                epubType: hijo.metadatosExportacion?.epubType || ''
            })) : []
        };

        parrafos.push(parrafo);
    });

    return parrafos;
}

// ============================================================================
// EMPAQUETADO EPUB3 PERSONALIZADO
// ============================================================================
async function empaquetarEPUB(carpetaLibro, metadatosSeguros, nombreBaseSeguro, htmlContent, cssContent) {
    const epubPath = path.join(carpetaLibro, `${nombreBaseSeguro}.epub`);
    const output = fs.createWriteStream(epubPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.append('application/epub+zip', { name: 'mimetype', store: true });

    archive.append(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n' +
        '  <rootfiles>\n' +
        '    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n' +
        '  </rootfiles>\n' +
        '</container>',
        { name: 'META-INF/container.xml' }
    );

    const identificador = metadatosSeguros.uuid || `urn:uuid:${Date.now()}`;
    const titulo = metadatosSeguros.titulo || nombreBaseSeguro;
    const opf = `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">\n` +
        `  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n` +
        `    <dc:identifier id="pub-id">${identificador}</dc:identifier>\n` +
        `    <dc:title>${titulo}</dc:title>\n` +
        `    <dc:language>es</dc:language>\n` +
        `    <meta property="dcterms:modified">${new Date().toISOString()}</meta>\n` +
        `  </metadata>\n` +
        `  <manifest>\n` +
        `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n` +
        `    <item id="content" href="${nombreBaseSeguro}.xhtml" media-type="application/xhtml+xml"/>\n` +
        `    <item id="css" href="styles.css" media-type="text/css"/>\n` +
        `  </manifest>\n` +
        `  <spine>\n` +
        `    <itemref idref="nav" linear="no"/>\n` +
        `    <itemref idref="content"/>\n` +
        `  </spine>\n` +
        `</package>`;

    archive.append(opf, { name: 'OEBPS/content.opf' });

    const nav = `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<!DOCTYPE html>\n` +
        `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="es">\n` +
        `<head><meta charset="utf-8"/><title>Tabla de Contenidos</title></head>\n` +
        `<body><nav epub:type="toc" id="toc"><ol><li><a href="${nombreBaseSeguro}.xhtml">Inicio</a></li></ol></nav></body>\n` +
        `</html>`;

    archive.append(nav, { name: 'OEBPS/nav.xhtml' });
    archive.append(cssContent, { name: 'OEBPS/styles.css' });
    archive.append(htmlContent, { name: `OEBPS/${nombreBaseSeguro}.xhtml` });

    await archive.finalize();
    return epubPath;
}

// ============================================================================
// GENERACIÓN DE PDF CON NOMBRE ALTERNATIVO SI ESTÁ BLOQUEADO
// ============================================================================
async function generarPDFAccesible(carpetaSalida, nombreBase, htmlContent, cssContent) {
    const tempHtml = path.join(carpetaSalida, `${nombreBase}_temp.html`);
    let pdfPath = path.join(carpetaSalida, `${nombreBase}_accesible.pdf`);

    if (fs.existsSync(pdfPath)) {
        try {
            fs.unlinkSync(pdfPath);
            console.log(`🗑️ PDF anterior eliminado: ${pdfPath}`);
        } catch (err) {
            if (err.code === 'EBUSY' || err.code === 'EPERM') {
                console.warn(`⚠️ No se pudo eliminar ${pdfPath}. Está abierto en otro programa.`);
                pdfPath = path.join(carpetaSalida, `${nombreBase}_accesible_${Date.now()}.pdf`);
                console.log(`📄 Usando nombre alternativo: ${pdfPath}`);
            } else {
                throw err;
            }
        }
    }

    const htmlCompleto = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><style>${cssContent}</style></head><body>${htmlContent}</body></html>`;
    fs.writeFileSync(tempHtml, htmlCompleto, 'utf-8');

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('file://' + tempHtml, { waitUntil: 'networkidle0' });
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });
    await browser.close();

    fs.removeSync(tempHtml);
    return pdfPath;
}

// ============================================================================
// ORQUESTADOR INDUSTRIAL
// ============================================================================
(async () => {
    try {
        console.log("🚀 Iniciando orquestación Node.js (LexDigitalHD)...");

        const argArchivo = process.argv[2];
        if (!argArchivo) {
            throw new Error('Debe especificar el nombre del documento (Ej: node compilar.js fragmento)');
        }

        let nombreSinExt = argArchivo
			.replace(/\.json$/i, '')
			.replace(/_ast_enriquecido$/i, '')
			.replace(/\.ast_enriquecido$/i, '')
			.replace(/_ast$/i, '')
			.replace(/\.ast$/i, '')
			.replace(/_estilos$/i, '')
			.replace(/\.estilos$/i, '')
			.replace(/_contenido$/i, '')
			.replace(/\.contenido$/i, '')
			.replace(/_extraido$/i, '')
			.replace(/\.extraido$/i, '')
			.replace(/_estructura$/i, '')
			.replace(/\.estructura$/i, '')
			.replace(/_semantic_map$/i, '')
			.replace(/\.semantic_map$/i, '')
			.trim();
        const nombreBaseSeguro = slugify(nombreSinExt);
        const carpetaLibro = path.join(PUBLICACIONES, nombreBaseSeguro);
        fs.ensureDirSync(carpetaLibro);

        // ====================================================================
        // FASE 1: CARGA DE ARTEFACTOS NATIVOS
        // ====================================================================
        telemetria.iniciar('1. Carga de artefactos nativos');
        console.log("📂 Consumiendo artefactos nativos desde InDesign...");

        const rutaAST = buscarAST(nombreSinExt);
        // Usar parseo seguro para evitar "Bad control character"
        let ast = purificarAST(parsearJSONSeguro(fs.readFileSync(rutaAST, 'utf8')));

        // Fusión CSS (igual que antes)
        const rutaCssNativo = (() => {
            const posibles = ['styles.css', 'lextilos.css'];
            for (const nombre of posibles) {
                const ruta = path.join(ESTILOS, nombre);
                if (fs.existsSync(ruta)) return ruta;
            }
            return null;
        })();
        const rutaCssMaestro = path.join(ESTILOS, 'lexcodex_master.css');

        let cssFinal = '/* CSS CONSOLIDADO: NATIVO + LEXCODEX MASTER */\n\n';
        if (rutaCssNativo && fs.existsSync(rutaCssNativo)) {
            cssFinal += '/* --- ESTILOS NATIVOS (InDesign Fallback) --- */\n' + fs.readFileSync(rutaCssNativo, 'utf8') + '\n\n';
        }
        if (fs.existsSync(rutaCssMaestro)) {
            cssFinal += '/* --- ESTILOS MAESTROS (LexCodex) --- */\n' + fs.readFileSync(rutaCssMaestro, 'utf8') + '\n\n';
        }

        cssFinal = cssFinal.replace(/proyecto-lexdigital_modular\/Estilos\/lexcodex_master\.css/g, '');
        cssFinal = cssFinal.replace(/Mostrando proyecto-lexdigital_modular\/Estilos\/lexcodex_master\.css\./g, '');

        fs.copySync(rutaAST, path.join(carpetaLibro, `${nombreBaseSeguro}.json`));
        fs.writeFileSync(path.join(carpetaLibro, `${nombreBaseSeguro}.css`), cssFinal, 'utf8');
        telemetria.finalizar();

        // ====================================================================
        // FASE 2: PREPARACIÓN DE PÁRRAFOS
        // ====================================================================
        telemetria.iniciar('2. Preparación de párrafos');
        console.log("📦 Preparando párrafos desde AST enriquecido...");

        let parrafos = [];

        // Priorizar cuerpoObra (AST enriquecido)
        if (Array.isArray(ast.cuerpoObra) && ast.cuerpoObra.length > 0) {
            parrafos = normalizarParrafosEnriquecidos(ast);
            console.log(`🔍 Párrafos enriquecidos detectados: ${parrafos.length}`);
        } else {
            // Fallback a adaptador clásico
            const resultadoAdaptacion = adaptarInDesign({ jsonCrudo: ast, semanticMap: {} });
            if (resultadoAdaptacion && resultadoAdaptacion.ast) {
                parrafos = extraerParrafos(resultadoAdaptacion.ast);
            }
            if (parrafos.length === 0) {
                parrafos = extraerParrafos(ast);
            }

            console.log(`🔍 Párrafos clásicos detectados: ${parrafos.length}`);

            // Aplicar limpieza clásica
            parrafos = limpiarParrafos(parrafos);

            // Heurística por estilo (fallback)
            parrafos.forEach(parr => {
                const grepAnalisis = evaluarTokenConGrep(parr.texto || '');
                parr.tipo = grepAnalisis.tipo || 'texto';
                parr.epubType = grepAnalisis.epubType || '';
                parr.nivelHtml = grepAnalisis.nivelHtml || '';

                let nombreEstilo = parr.inDesignStyle?.nombreEstilo || parr.inDesignStyle || parr.estiloParrafo?.nombreEstilo || parr.estilo || parr.claseLegal || 'parrafo';
                if (typeof nombreEstilo === 'object') nombreEstilo = nombreEstilo.nombreEstilo || 'parrafo';

                let claseLimpia = String(nombreEstilo)
                    .replace(/\uFEFF/g, '')
                    .replace(/^\[|\]$/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/[^a-zA-Z0-9_-]/g, '')
                    .toLowerCase();

                if (claseLimpia === '' || claseLimpia === 'ningun-estilo-de-parrafo') {
                    claseLimpia = 'parrafo';
                }
                parr.claseLegal = parr.resolvedClass || claseLimpia || 'parrafo';
            });
        }
        telemetria.finalizar();

        // ====================================================================
        // FASE 3: GENERACIÓN XHTML
        // ====================================================================
        telemetria.iniciar('3. Generación XHTML');
        console.log("📑 Generando estructura de navegación XHTML...");

        const metadatosSeguros = ast?.metadatosDocumento || ast?.document || ast?.metadatos || { titulo: nombreBaseSeguro };
        const tituloDoc = metadatosSeguros.titulo || metadatosSeguros.name || nombreBaseSeguro;

        const tocItems = TocGenerator.extraerEstructura(parrafos);
        const htmlFinal = construirEstructura(parrafos, metadatosSeguros, `${nombreBaseSeguro}.css`, cssFinal, tituloDoc);

        let notasArray = [];
        const rutaJsonNotas = path.join(MIS_JSON, 'notas_extraidas.json');
        if (fs.existsSync(rutaJsonNotas)) {
            notasArray = purificarAST(parsearJSONSeguro(fs.readFileSync(rutaJsonNotas, 'utf8'))).notas || [];
        }
        const htmlConNotas = insertarNotasEnHtml(htmlFinal, notasArray);
        const tocXhtml = TocGenerator.construirTocXhtml(tocItems, tituloDoc);
        telemetria.finalizar();

        // ====================================================================
        // FASE 4: GUARDADO Y EMPAQUETADO
        // ====================================================================
        telemetria.iniciar('4. Guardado y empaquetado');
        console.log("🗂️ Escribiendo documentos finales en /publicaciones...");
        fs.writeFileSync(path.join(carpetaLibro, `${nombreBaseSeguro}.xhtml`), htmlConNotas, 'utf8');
        fs.writeFileSync(path.join(carpetaLibro, 'toc.xhtml'), tocXhtml, 'utf8');

        console.log("📦 Empaquetando EPUB3 y renderizando PDF...");
        const rutaEpubFinal = await empaquetarEPUB(carpetaLibro, metadatosSeguros, nombreBaseSeguro, htmlConNotas, cssFinal);
        const rutaPdfFinal = await generarPDFAccesible(carpetaLibro, nombreBaseSeguro, htmlConNotas, cssFinal);
        telemetria.finalizar();

        // ====================================================================
        // FASE FINAL: TELEMETRÍA
        // ====================================================================
        telemetria.imprimirResumen();
        telemetria.guardarReporte(path.join(carpetaLibro, 'telemetria.json'));

        console.log(`\n🎉 ¡SISTEMA SINGLE-SOURCE COMPLETADO CON CALIDAD EDITORIAL!`);
        console.log(`   📂 Directorio final: ${carpetaLibro}`);
    } catch (error) {
        console.error("\n❌ ERROR EN EL ORQUESTADOR NODE.JS:");
        console.error(error);
        process.exit(1);
    }
})();