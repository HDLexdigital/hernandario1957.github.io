import { MultisourceEngine } from './MultisourceEngine';
import { XhtmlAdapter } from '../adapters/XhtmlAdapter';
import { EpubAdapter } from '../adapters/EpubAdapter';
import { PdfUaAdapter } from '../adapters/PdfUaAdapter';
import { PdfPrintAdapter } from '../adapters/PdfPrintAdapter';
import { PwaAdapter } from '../adapters/PwaAdapter';
import { SemanticIndexer } from './SemanticIndexer';
import { SearchIndexer } from './SearchIndexer';
import { MultisourceValidator } from '../validadores/C01-03-multisource.validator';

async function runFullBuild() {
  console.log('--- INICIANDO COMPILACIÓN TOTAL Y GENERACIÓN DE ÍNDICES ---\n');
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
      dublinCore: { title: "Constitución Política", creator: "Asamblea", language: "es-CO", identifier: "urn:lex:co:const" },
      a11y: { wcagLevel: "AA" }
    },
    semanticTree: { 
      documentId: "constitucion", 
      nodes: [
        { id: "t1", type: "title", content: "PREÁMBULO" },
        { 
          id: "cap1", 
          type: "chapter", 
          content: "CAPÍTULO I",
          children: [
            { 
              id: "art13", 
              type: "article", 
              content: "Artículo 13",
              children: [
                { id: "p1", type: "paragraph", content: "El Estado promoverá las condiciones para que la igualdad sea real y efectiva..." }
              ]
            }
          ]
        }
      ] 
    },
    targetDirectives: {
      xhtml: { modularizeBy: "chapter" }, epub3: { includeFallbackFonts: true },
      pdfUa: { taggingStrategy: "strict" }, pdfPrint: { colorProfile: "CMYK-FOGRA39" }, pwa: { offlineStrategy: "cache-first" }
    }
  };

  try {
    await engine.execute(validPayload);
    
    const validator = new MultisourceValidator();
    const contract = validator.validate(validPayload);
    
    // Generar TOC Semántico
    const semanticIndexer = new SemanticIndexer();
    await semanticIndexer.generateAndPersist(contract);

    // Generar Índice de Búsqueda
    const searchIndexer = new SearchIndexer();
    await searchIndexer.generateAndPersist(contract);

    console.log(`\n✅ ARTEFACTOS Y MOTOR DE BÚSQUEDA GENERADOS EXITOSAMENTE.`);
  } catch (error) {
    console.error('❌ FALLO:', error);
  }
}

runFullBuild();
