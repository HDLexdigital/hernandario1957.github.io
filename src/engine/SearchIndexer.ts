import * as fs from 'fs/promises';
import * as path from 'path';
import { C01_03_ContractMultisource, SemanticNode } from '../contracts/C01-03-multisource';

export interface SearchEntry {
  id: string;
  title: string;
  content: string;
  href: string;
}

export class SearchIndexer {
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  /**
   * Extrae y concatena recursivamente todo el texto plano de un nodo y sus hijos.
   */
  private extractFullText(node: SemanticNode): string {
    let text = node.content || '';
    if (node.children && node.children.length > 0) {
      const childrenText = node.children.map(child => this.extractFullText(child)).join(' ');
      text = `${text} ${childrenText}`;
    }
    return text.replace(/\s+/g, ' ').trim();
  }

  private visitNode(node: SemanticNode, entries: SearchEntry[], docId: string): void {
    const searchableTypes = ['title', 'chapter', 'section', 'article'];

    if (searchableTypes.includes(node.type)) {
      const rawTitle = node.content || node.id;
      const slug = this.slugify(rawTitle);
      
      entries.push({
        id: node.id,
        title: rawTitle,
        content: this.extractFullText(node).toLowerCase(), // Guardamos en minúsculas para búsquedas rápidas
        href: `/${docId}/${slug}`
      });
    }

    if (node.children) {
      for (const child of node.children) {
        this.visitNode(child, entries, docId);
      }
    }
  }

  public async generateAndPersist(contract: C01_03_ContractMultisource): Promise<string> {
    const docId = contract.semanticTree.documentId;
    const entries: SearchEntry[] = [];

    for (const node of contract.semanticTree.nodes) {
      this.visitNode(node, entries, docId);
    }

    const indexPath = path.resolve(process.cwd(), `dist/indexes/search-${contract.sourceHash}.json`);
    await fs.mkdir(path.dirname(indexPath), { recursive: true });
    
    // Guardamos el JSON de búsqueda
    await fs.writeFile(indexPath, JSON.stringify({ entries }, null, 2), 'utf8');

    console.log(`[SEARCH] Índice Full-Text generado: search-${contract.sourceHash}.json (${entries.length} bloques indexados)`);
    return indexPath;
  }
}
