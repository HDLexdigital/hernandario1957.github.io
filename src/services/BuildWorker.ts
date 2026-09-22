import { TransactionRegistryService } from './TransactionRegistryService';
import { VersioningService } from './VersioningService';
import { MultisourceEngine } from '../engine/MultisourceEngine';
import { SemanticIndexer } from '../engine/SemanticIndexer';
import { SearchIndexer } from '../engine/SearchIndexer';
import { GraphBuilder } from '../engine/GraphBuilder';
import { PdfPrintAdapter } from '../adapters/PdfPrintAdapter';
import { MultisourceValidator } from '../validadores/C01-03-multisource.validator';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

export interface BuildJob {
  txId: string;
  documentId: string;
  sourceHash: string;
}

export class BuildWorker {
  private registry = new TransactionRegistryService();
  private versioning = new VersioningService();

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
        a11y: { wcagLevel: "AA", readingOrderEnforced: true }
      },
      semanticTree: {
        documentId: "constitucion",
        nodes: [
          {
            id: "art13",
            type: "article",
            content: "Artículo 13. Todas las personas nacen libres e iguales ante la ley.",
            metadata: { number: 13 }
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
      const contract = new MultisourceValidator().validate(payload);

      // --- ETAPA 1: XHTML Físico ---
      const xhtmlDir = path.resolve(txDir, 'xhtml');
      await fs.mkdir(xhtmlDir, { recursive: true });
      const xhtmlPath = path.resolve(xhtmlDir, 'index.xhtml');
      
      const xhtmlContent = `
        <html lang="es">
          <head><meta charset="utf-8" /><title>Constitución</title></head>
          <body>
            <section class="chapter">
              <p id="art13">Artículo 13. Todas las personas nacen libres e iguales ante la ley.</p>
            </section>
          </body>
        </html>
      `;
      await fs.writeFile(xhtmlPath, xhtmlContent, 'utf8');

      const xhtmlRecord = await this.registry.computeArtifactRecord(xhtmlPath);
      await this.registry.attachArtifact(job.txId, 'xhtml', xhtmlRecord);

      // --- ETAPA 2: TOC Semántico ---
      const tocPath = await new SemanticIndexer().generateAndPersist(contract);
      await this.registry.attachArtifact(job.txId, 'toc', await this.registry.computeArtifactRecord(tocPath));

      // --- ETAPA 3: Search Index ---
      const searchPath = await new SearchIndexer().generateAndPersist(contract);
      await this.registry.attachArtifact(job.txId, 'search', await this.registry.computeArtifactRecord(searchPath));

      // --- ETAPA 4: Graph Knowledge ---
      const graphPath = await new GraphBuilder().buildFromSearchIndex(job.txId);
      await this.registry.attachArtifact(job.txId, 'graph', await this.registry.computeArtifactRecord(graphPath));

      // --- ETAPA 5: PDF Físico ---
      const pdfPath = await new PdfPrintAdapter().process(contract, txDir);
      await this.registry.attachArtifact(job.txId, 'pdf', await this.registry.computeArtifactRecord(pdfPath));

      // --- ETAPA 6: Versionado Normativo (MVP-066) ---
      // Calculamos hash del nodo individual y registramos su línea temporal cronológica
      const nodeHash = crypto.createHash('sha256').update("Artículo 13. Todas las personas nacen libres e iguales ante la ley.").digest('hex');
      await this.versioning.registerTransactionVersions(
        'constitucion',
        job.txId,
        new Date().toISOString().split('T')[0], // Fecha efectiva (YYYY-MM-DD)
        [{ id: 'art13', title: 'Artículo 13', contentHash: nodeHash }]
      );

      // CIERRE EXITOSO
      await this.registry.transitionStatus(job.txId, 'success', [`Pipeline y versionado completados en ${Date.now() - startTime}ms`]);
      console.log(`[WORKER] TX ${job.txId} finalizada y registrada en la memoria normativa.`);

    } catch (error: any) {
      console.error(`[WORKER] Fallo en TX ${job.txId}:`, error.message);
      await this.registry.transitionStatus(job.txId, 'failed', [`Error en pipeline: ${error.message}`]);
    }
  }
}
