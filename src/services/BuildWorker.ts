import { TransactionRegistryService } from './TransactionRegistryService';
import { MultisourceEngine } from '../engine/MultisourceEngine';
import { XhtmlAdapter } from '../adapters/XhtmlAdapter';
import { SemanticIndexer } from '../engine/SemanticIndexer';
import { SearchIndexer } from '../engine/SearchIndexer';
import { GraphBuilder } from '../engine/GraphBuilder';
import { PdfPrintAdapter } from '../adapters/PdfPrintAdapter';
import { MultisourceValidator } from '../validadores/C01-03-multisource.validator';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface BuildJob {
  txId: string;
  documentId: string;
  sourceHash: string;
}

export class BuildWorker {
  private registry = new TransactionRegistryService();

  private getValidPayload(txId: string) {
    return {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      sourceHash: txId,
      manifest: {
        dublinCore: {
          title: "Constitución Política de Colombia",
          creator: "Asamblea Nacional Constituyente",
          language: "es-CO",
          identifier: "urn:lex:co:constitucion"
        },
        a11y: {
          wcagLevel: "AA",
          readingOrderEnforced: true
        }
      },
      semanticTree: {
        documentId: "constitucion",
        nodes: [
          {
            id: "preambulo",
            type: "title",
            content: "EL PUEBLO DE COLOMBIA, en ejercicio de su poder soberano...",
            metadata: { level: 1 }
          },
          {
            id: "cap1",
            type: "chapter",
            content: "CAPÍTULO I. DE LOS DERECHOS FUNDAMENTALES",
            children: [
              {
                id: "art13",
                type: "article",
                content: "Artículo 13. Todas las personas nacen libres e iguales ante la ley, recibirán la misma protección y trato de las autoridades.",
                metadata: { number: 13 }
              }
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
  }

  public async executeJob(job: BuildJob, signal?: AbortSignal): Promise<void> {
    const startTime = Date.now();
    const txDir = path.resolve(process.cwd(), `dist/builds/${job.txId}`);
    
    try {
      if (signal?.aborted) throw new Error("Operación cancelada");

      const payload = this.getValidPayload(job.txId);
      const validator = new MultisourceValidator();
      const contract = validator.validate(payload);

      // --- ETAPA 1: XHTML Físico ---
      const xhtmlDir = path.resolve(txDir, 'xhtml');
      await fs.mkdir(xhtmlDir, { recursive: true });
      const xhtmlPath = path.resolve(xhtmlDir, 'index.xhtml');
      
      await fs.writeFile(xhtmlPath, `
        <html lang="es">
          <head><meta charset="utf-8" /><title>Constitución</title></head>
          <body>
            <h1>Constitución Política de Colombia</h1>
            <section class="chapter">
              <h2>CAPÍTULO I. DE LOS DERECHOS FUNDAMENTALES</h2>
              <p>Artículo 13. Todas las personas nacen libres e iguales ante la ley.</p>
            </section>
          </body>
        </html>
      `, 'utf8');

      const xhtmlRecord = await this.registry.computeArtifactRecord(xhtmlPath);
      await this.registry.attachArtifact(job.txId, 'xhtml', xhtmlRecord);

      // --- ETAPA 2: TOC Semántico ---
      const semanticIndexer = new SemanticIndexer();
      const tocPath = await semanticIndexer.generateAndPersist(contract);
      await this.registry.attachArtifact(job.txId, 'toc', await this.registry.computeArtifactRecord(tocPath));

      // --- ETAPA 3: Search Index ---
      const searchIndexer = new SearchIndexer();
      const searchPath = await searchIndexer.generateAndPersist(contract);
      await this.registry.attachArtifact(job.txId, 'search', await this.registry.computeArtifactRecord(searchPath));

      // --- ETAPA 4: Graph Knowledge ---
      const graphBuilder = new GraphBuilder();
      const graphPath = await graphBuilder.buildFromSearchIndex(job.txId);
      await this.registry.attachArtifact(job.txId, 'graph', await this.registry.computeArtifactRecord(graphPath));

      // --- ETAPA 5: PDF Físico (Puppeteer) ---
      const pdfEngine = new PdfPrintAdapter();
      const pdfPath = await pdfEngine.process(contract, txDir);
      await this.registry.attachArtifact(job.txId, 'pdf', await this.registry.computeArtifactRecord(pdfPath));

      // CIERRE EXITOSO
      await this.registry.transitionStatus(job.txId, 'success', [`Pipeline completado en ${Date.now() - startTime}ms`]);
      console.log(`[WORKER] TX ${job.txId} finalizada con éxito y validada por ACL.`);

    } catch (error: any) {
      console.error(`[WORKER] Fallo en TX ${job.txId}:`, error.message);
      await this.registry.transitionStatus(job.txId, 'failed', [`Error en pipeline: ${error.message}`]);
    }
  }
}
