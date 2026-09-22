import * as fs from 'fs/promises';
import * as path from 'path';

export interface GraphNode {
  data: { id: string; label: string; type: string; href: string };
}

export interface GraphEdge {
  data: { source: string; target: string; type: 'cites' | 'modifies' };
}

export interface LegalGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class GraphBuilder {
  public async buildFromSearchIndex(hash: string): Promise<string> {
    const searchPath = path.resolve(process.cwd(), `dist/indexes/search-${hash}.json`);
    const searchData = JSON.parse(await fs.readFile(searchPath, 'utf8'));
    
    const graph: LegalGraph = { nodes: [], edges: [] };
    const validIds = new Set<string>();

    // 1. Construir Nodos
    for (const entry of searchData.entries) {
      validIds.add(entry.id);
      graph.nodes.push({
        data: {
          id: entry.id,
          label: entry.title,
          type: entry.id.startsWith('art') ? 'article' : 'section',
          href: entry.href
        }
      });
    }

    // 2. Construir Aristas (Edges) mediante análisis de texto
    const regex = /\b(art[ií]culo|art\.)\s+(\d+)\b/gi;
    
    for (const entry of searchData.entries) {
      const text = entry.content;
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const targetId = `art${match[2]}`; // Normalizamos a "art13"
        
        // Solo creamos la arista si el nodo destino existe y no es una auto-referencia
        if (validIds.has(targetId) && targetId !== entry.id) {
          graph.edges.push({
            data: {
              source: entry.id,
              target: targetId,
              type: 'cites'
            }
          });
        }
      }
    }

    // 3. Persistir el artefacto del Grafo
    const graphPath = path.resolve(process.cwd(), `dist/indexes/graph-${hash}.json`);
    await fs.writeFile(graphPath, JSON.stringify(graph, null, 2), 'utf8');
    
    console.log(`[GRAPH] Grafo jurídico generado: graph-${hash}.json (${graph.nodes.length} nodos, ${graph.edges.length} conexiones)`);
    return graphPath;
  }
}
