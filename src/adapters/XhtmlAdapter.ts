/**
 * @file XhtmlAdapter.ts
 * @description Proyector pasivo a XHTML Modular. 
 * Cumple la regla: "La Interfaz y Adaptadores son Pasivos".
 */
import { IOutputAdapter } from './IOutputAdapter';
import { C01_03_ContractMultisource, SemanticNode } from '../contracts/C01-03-multisource';

export class XhtmlAdapter implements IOutputAdapter {
  public readonly formatName = 'XHTML-Modular';

  public async process(contract: C01_03_ContractMultisource): Promise<void> {
    console.log(`\n[${this.formatName}] Iniciando proyección...`);
    
    const directives = contract.targetDirectives.xhtml;
    const documentId = contract.semanticTree.documentId;
    const nodes = contract.semanticTree.nodes;

    console.log(`[${this.formatName}] Estrategia de fragmentación: ${directives.modularizeBy}`);
    
    // Proyección pasiva: Recorremos el árbol inmutable
    const xhtmlBuffer = this.projectNodes(nodes);

    console.log(`[${this.formatName}] ✅ Proyección completada en memoria para el documento: ${documentId}`);
    // Aquí (en la siguiente iteración) implementaremos la escritura a disco con Node fs.
  }

  /**
   * Transforma recursivamente los nodos semánticos en etiquetas XHTML estandarizadas.
   */
  private projectNodes(nodes: readonly SemanticNode[], level: number = 1): string {
    let output = '';
    
    for (const node of nodes) {
      // Mapeo determinista 1:1 según el tipo de nodo
      switch (node.type) {
        case 'title':
          output += `<h${level} id="${node.id}">${this.escapeHtml(node.content || '')}</h${level}>\n`;
          break;
        case 'chapter':
          output += `<section id="${node.id}" class="chapter">\n`;
          if (node.children) output += this.projectNodes(node.children, level + 1);
          output += `</section>\n`;
          break;
        case 'article':
          output += `<article id="${node.id}">\n`;
          if (node.children) output += this.projectNodes(node.children, level + 1);
          output += `</article>\n`;
          break;
        case 'paragraph':
          output += `<p id="${node.id}">${this.escapeHtml(node.content || '')}</p>\n`;
          break;
        default:
          console.warn(`[${this.formatName}] Nodo ignorado o no soportado: ${node.type}`);
      }
    }
    return output;
  }

  /**
   * Garantiza la sanidad del contenido en formato XML.
   */
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
