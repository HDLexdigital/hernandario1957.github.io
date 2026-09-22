import * as fs from 'fs/promises';
import * as path from 'path';
import { C01_03_ContractMultisource, SemanticNode } from '../contracts/C01-03-multisource';

export interface TocEntry {
  id: string;
  type: 'title' | 'chapter' | 'section' | 'article' | 'paragraph';
  title: string;
  href: string;
  parent: string | null;
  level: number;
}

export interface SemanticIndex {
  documentId: string;
  sourceHash: string;
  generatedAt: string;
  entries: TocEntry[];
}

export class SemanticIndexer {
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  private visitNode(
    node: SemanticNode, 
    entries: TocEntry[], 
    docId: string, 
    parentSlug: string | null, 
    level: number
  ): void {
    const relevantTypes = ['title', 'chapter', 'section', 'article'];
    let currentSlug = parentSlug;

    if (relevantTypes.includes(node.type)) {
      const rawTitle = node.content || node.id;
      const slug = this.slugify(rawTitle);
      currentSlug = slug;

      entries.push({
        id: node.id,
        type: node.type as any,
        title: rawTitle,
        href: `/${docId}/${slug}`,
        parent: parentSlug,
        level
      });
    }

    if (node.children) {
      for (const child of node.children) {
        this.visitNode(child, entries, docId, currentSlug, level + 1);
      }
    }
  }

  public async generateAndPersist(contract: C01_03_ContractMultisource): Promise<string> {
    const docId = contract.semanticTree.documentId;
    const entries: TocEntry[] = [];

    for (const node of contract.semanticTree.nodes) {
      this.visitNode(node, entries, docId, null, 1);
    }

    const indexData: SemanticIndex = {
      documentId: docId,
      sourceHash: contract.sourceHash,
      generatedAt: new Date().toISOString(),
      entries
    };

    const indexPath = path.resolve(process.cwd(), `dist/indexes/toc-${contract.sourceHash}.json`);
    await fs.mkdir(path.dirname(indexPath), { recursive: true });
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2), 'utf8');

    console.log(`[INDEXER] TOC semántico generado: toc-${contract.sourceHash}.json (${entries.length} entradas)`);
    return indexPath;
  }
}
