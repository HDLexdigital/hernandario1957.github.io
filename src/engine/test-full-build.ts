import { MultisourceEngine } from './MultisourceEngine';
import { XhtmlAdapter } from '../adapters/XhtmlAdapter';
import { EpubAdapter } from '../adapters/EpubAdapter';
import { PdfUaAdapter } from '../adapters/PdfUaAdapter';
import { PdfPrintAdapter } from '../adapters/PdfPrintAdapter';
import { PwaAdapter } from '../adapters/PwaAdapter';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runFullBuild() {
  console.log('--- INICIANDO COMPILACIÓN FÍSICA TOTAL (5 FORMATOS) ---\n');
  const engine = new MultisourceEngine();
  
  engine.registerAdapter(new XhtmlAdapter());
  engine.registerAdapter(new EpubAdapter());
  engine.registerAdapter(new PdfUaAdapter());
  engine.registerAdapter(new PdfPrintAdapter());
  engine.registerAdapter(new PwaAdapter());

  const validPayload = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    sourceHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    manifest: {
      dublinCore: { title: "Código de Comercio", creator: "Congreso de la República", language: "es-CO", identifier: "urn:lex:co:comercio" },
      a11y: { wcagLevel: "AA" }
    },
    semanticTree: { documentId: "cod-com", nodes: [{ id: "t1", type: "title", content: "Título Preliminar" }] },
    targetDirectives: {
      xhtml: { modularizeBy: "chapter" }, epub3: { includeFallbackFonts: true },
      pdfUa: { taggingStrategy: "strict" }, pdfPrint: { colorProfile: "CMYK-FOGRA39" }, pwa: { offlineStrategy: "cache-first" }
    }
  };

  try {
    await engine.execute(validPayload);
    
    const indexPath = path.resolve(process.cwd(), `dist/indexes/${validPayload.sourceHash}.json`);
    const txId = JSON.parse(await fs.readFile(indexPath, 'utf8')).currentTxId;

    const buildPath = path.resolve(process.cwd(), `dist/builds/${txId}`);
    console.log(`✅ COMPILACIÓN TOTAL ATÓMICA EXITOSA.\n`);
    console.log(`Todos los adaptadores resolvieron sus I/O concurrentemente en: ${buildPath}`);
    
    // Listamos el contenido de los 5 namespaces generados
    const dirs = await fs.readdir(buildPath);
    console.log('\nNamespaces generados en la transacción:');
    for (const d of dirs) console.log(`- ${d}/`);

  } catch (error) {
    console.error('❌ FALLO:', error);
  }
}

runFullBuild();
