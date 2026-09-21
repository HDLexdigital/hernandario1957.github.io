import { Writable } from 'stream';
import { IOutputAdapter } from './IOutputAdapter';
import { C01_03_ContractMultisource, SemanticNode } from '../contracts/C01-03-multisource';
import { ContractFormat, IVirtualFileSystem } from '../contracts/MVP-057-transaction';

export class XhtmlAdapter implements IOutputAdapter {
  public readonly formatId = ContractFormat.XHTML;

  public async process(
    contract: C01_03_ContractMultisource, 
    vfs: IVirtualFileSystem,
    abortSignal: AbortSignal
  ): Promise<void> {
    
    return new Promise(async (resolve, reject) => {
      let stream: Writable;
      
      try {
        // 1. Solicitud al VFS enjaulado (solo nombre relativo)
        stream = await vfs.createWriteStream('index.xhtml');
      } catch (err) {
        return reject(err);
      }

      // 2. Garantía física de cierre
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));

      // 3. Contrato de cancelación coordinada
      abortSignal.addEventListener('abort', () => {
        // Destruir el descriptor abierto inmediatamente
        stream.destroy(new Error(`[VFS-${this.formatId}] Cancelación propagada. Stream destruido.`));
      });

      try {
        const nodes = contract.semanticTree.nodes;
        const metadata = contract.manifest.dublinCore;
        
        // Emisión por streams chunk a chunk (Backpressure nativo)
        stream.write(`<?xml version="1.0" encoding="UTF-8"?>\n`);
        stream.write(`<!DOCTYPE html>\n`);
        stream.write(`<html xmlns="http://www.w3.org/1999/xhtml" lang="${metadata.language}">\n`);
        stream.write(`<head>\n<title>${this.escapeXml(metadata.title)}</title>\n</head>\n`);
        stream.write(`<body>\n`);

        // Proyección recursiva del árbol
        this.projectNodes(nodes, stream, abortSignal, 1);

        stream.write(`</body>\n</html>`);
        
        // 4. flush físico final (dispara el evento 'finish' que resuelve la promesa)
        stream.end(); 
      } catch (err) {
        stream.destroy(err as Error);
      }
    });
  }

  private projectNodes(nodes: readonly SemanticNode[], stream: Writable, signal: AbortSignal, level: number): void {
    for (const node of nodes) {
      // Monitoreo atómico de cancelación antes de escribir cada nodo
      if (signal.aborted) {
        throw new Error('Ejecución interrumpida externamente.');
      }

      switch (node.type) {
        case 'title':
          stream.write(`<h${level} id="${node.id}">${this.escapeXml(node.content || '')}</h${level}>\n`);
          break;
        case 'chapter':
          stream.write(`<section id="${node.id}" class="chapter">\n`);
          if (node.children) this.projectNodes(node.children, stream, signal, level + 1);
          stream.write(`</section>\n`);
          break;
        case 'article':
          stream.write(`<article id="${node.id}">\n`);
          if (node.children) this.projectNodes(node.children, stream, signal, level + 1);
          stream.write(`</article>\n`);
          break;
        case 'paragraph':
          stream.write(`<p id="${node.id}">${this.escapeXml(node.content || '')}</p>\n`);
          break;
      }
    }
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
