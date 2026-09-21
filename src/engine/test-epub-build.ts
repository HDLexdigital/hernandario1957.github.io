import { MultisourceEngine } from './MultisourceEngine';
import { XhtmlAdapter } from '../adapters/XhtmlAdapter';
import { EpubAdapter } from '../adapters/EpubAdapter';
import { IOutputAdapter } from '../adapters/IOutputAdapter';
import { ContractFormat, IVirtualFileSystem } from '../contracts/MVP-057-transaction';
import * as fs from 'fs/promises';
import * as path from 'path';

class DummyWriterAdapter implements IOutputAdapter {
  constructor(public readonly formatId: ContractFormat) {}
  async process(c: any, vfs: IVirtualFileSystem): Promise<void> {
    const stream = await vfs.createWriteStream('mock.dat');
    return new Promise((resolve) => {
      stream.on('finish', resolve);
      stream.write('mock');
      stream.end();
    });
  }
}

async function runRealBuild() {
  console.log('--- INICIANDO COMPILACIÓN FÍSICA (XHTML + EPUB3) ---\n');
  const engine = new MultisourceEngine();
  
  engine.registerAdapter(new XhtmlAdapter());
  engine.registerAdapter(new EpubAdapter());
  engine.registerAdapter(new DummyWriterAdapter(ContractFormat.PDF_UA));
  engine.registerAdapter(new DummyWriterAdapter(ContractFormat.PDF_PRINT));
  engine.registerAdapter(new DummyWriterAdapter(ContractFormat.PWA));

  const validPayload = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    // HASH CORREGIDO: 64 caracteres hexadecimales
    sourceHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    manifest: {
      dublinCore: { title: "Código Civil Colombiano", creator: "Congreso de la República", language: "es-CO", identifier: "urn:lex:co" },
      a11y: { wcagLevel: "AA" }
    },
    semanticTree: { documentId: "cod-civil", nodes: [{ id: "t1", type: "title", content: "Libro Primero" }] },
    targetDirectives: {
      xhtml: { modularizeBy: "chapter" }, epub3: { includeFallbackFonts: true },
      pdfUa: { taggingStrategy: "strict" }, pdfPrint: { colorProfile: "CMYK-FOGRA39" }, pwa: { offlineStrategy: "cache-first" }
    }
  };

  try {
    await engine.execute(validPayload);
    
    const indexPath = path.resolve(process.cwd(), `dist/indexes/${validPayload.sourceHash}.json`);
    const txId = JSON.parse(await fs.readFile(indexPath, 'utf8')).currentTxId;

    const epubPath = path.resolve(process.cwd(), `dist/builds/${txId}/epub3`);
    console.log(`✅ COMPILACIÓN ATÓMICA EXITOSA.\n`);
    
    console.log('--- ESTRUCTURA INTERNA GENERADA PARA EL EPUB3 ---');
    console.log(`- ${epubPath}/mimetype`);
    console.log(`- ${epubPath}/META-INF/container.xml`);
    console.log(`- ${epubPath}/OEBPS/package.opf\n`);

    const opfContent = await fs.readFile(path.join(epubPath, 'OEBPS/package.opf'), 'utf8');
    console.log('--- CONTENIDO DEL OPF ---');
    console.log(opfContent);
  } catch (error) {
    console.error('❌ FALLO:', error);
  }
}

runRealBuild();
