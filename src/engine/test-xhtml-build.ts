import { MultisourceEngine } from './MultisourceEngine';
import { XhtmlAdapter } from '../adapters/XhtmlAdapter';
import { IOutputAdapter } from '../adapters/IOutputAdapter';
import { ContractFormat, IVirtualFileSystem } from '../contracts/MVP-057-transaction';
import * as fs from 'fs/promises';
import * as path from 'path';

// Dummy adapter para engañar a los otros 4 formatos y lograr el Commit
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
  console.log('--- INICIANDO COMPILACIÓN FÍSICA (XHTML) ---\n');
  const engine = new MultisourceEngine();
  
  // 1. Registramos el Adaptador Real
  engine.registerAdapter(new XhtmlAdapter());
  
  // 2. Registramos los 4 restantes con Dummys (Para pasar el validateRegistryComplete y seal)
  engine.registerAdapter(new DummyWriterAdapter(ContractFormat.EPUB3));
  engine.registerAdapter(new DummyWriterAdapter(ContractFormat.PDF_UA));
  engine.registerAdapter(new DummyWriterAdapter(ContractFormat.PDF_PRINT));
  engine.registerAdapter(new DummyWriterAdapter(ContractFormat.PWA));

  const validPayload = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    sourceHash: "f9b2d8e498fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    manifest: {
      dublinCore: {
        title: "Constitución Política de Colombia (Prueba I/O)",
        creator: "Asamblea Nacional Constituyente",
        language: "es-CO",
        identifier: "urn:lex:co:estado:constitucion:1991"
      },
      a11y: { wcagLevel: "AA" }
    },
    semanticTree: {
      documentId: "const-1991",
      nodes: [
        { id: "t1", type: "title", content: "Preámbulo" },
        { 
          id: "cap1", 
          type: "chapter", 
          children: [
            { id: "art1", type: "article", children: [
              { id: "p1", type: "paragraph", content: "Colombia es un Estado social de derecho..." }
            ]}
          ]
        }
      ]
    },
    targetDirectives: {
      xhtml: { modularizeBy: "chapter" },
      epub3: { includeFallbackFonts: true },
      pdfUa: { taggingStrategy: "strict" },
      pdfPrint: { colorProfile: "CMYK-FOGRA39" },
      pwa: { offlineStrategy: "cache-first" }
    }
  };

  try {
    await engine.execute(validPayload);
    
    // Extraer el txId generado desde el índice
    const indexPath = path.resolve(process.cwd(), `dist/indexes/${validPayload.sourceHash}.json`);
    const indexData = JSON.parse(await fs.readFile(indexPath, 'utf8'));
    const txId = indexData.currentTxId;

    // Leer el archivo XHTML físico que el adaptador generó
    const xhtmlPath = path.resolve(process.cwd(), `dist/builds/${txId}/xhtml/index.xhtml`);
    const xhtmlContent = await fs.readFile(xhtmlPath, 'utf8');

    console.log(`✅ COMPILACIÓN EXITOSA. Archivo escrito atómicamente en:\n${xhtmlPath}\n`);
    console.log('--- CONTENIDO DEL XHTML GENERADO ---');
    console.log(xhtmlContent);
  } catch (error) {
    console.error('❌ FALLO:', error);
  }
}

runRealBuild();
