import { MultisourceValidator } from '../validadores/C01-03-multisource.validator';
import { MultisourceEngine } from './MultisourceEngine';
import { XhtmlAdapter } from '../adapters/XhtmlAdapter';
import { EpubAdapter } from '../adapters/EpubAdapter';
import { PdfUaAdapter } from '../adapters/PdfUaAdapter';
import { PdfPrintAdapter } from '../adapters/PdfPrintAdapter';
import { PwaAdapter } from '../adapters/PwaAdapter';

async function runIntegration() {
  console.log('--- INICIANDO INTEGRACIÓN TOTAL (5 FORMATOS) ---\n');

  const engine = new MultisourceEngine();
  
  // Registro pasivo de la estrella de 5 puntas
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
      dublinCore: {
        title: "Constitución Política de Colombia",
        creator: "Asamblea Nacional Constituyente",
        language: "es-CO",
        identifier: "urn:lex:co:estado:constitucion:1991"
      },
      a11y: { wcagLevel: "AA" }
    },
    semanticTree: {
      documentId: "const-1991",
      nodes: [
        { id: "t1", type: "title", content: "De los principios fundamentales" }
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
    console.log('\n✅ INTEGRACIÓN TOTAL EXITOSA: Motor Multisalida 100% operativo en memoria.');
  } catch (error) {
    console.error('\n❌ ERROR FATAL DURANTE LA INTEGRACIÓN:', error);
  }
}

runIntegration();
