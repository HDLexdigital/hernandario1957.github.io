import * as fs from 'fs/promises';
import * as path from 'path';

export interface VersionEntry {
  versionId: string;
  txId: string;
  effectiveDate: string;
  contentHash: string;
  status: 'active' | 'superseded' | 'current';
}

export interface NodeVersionTimeline {
  nodeId: string;
  title: string;
  versions: VersionEntry[];
}

export interface VersionsIndex {
  version: "1.0.0";
  documentId: string;
  lastUpdated: string;
  nodes: NodeVersionTimeline[];
}

export class VersioningService {
  private readonly versionsPath: string;

  constructor() {
    this.versionsPath = path.resolve(process.cwd(), 'dist/indexes/versions.json');
  }

  /**
   * Registra o actualiza la línea de tiempo de versiones a partir de una transacción exitosa.
   */
  public async registerTransactionVersions(
    documentId: string, 
    txId: string, 
    effectiveDate: string,
    nodes: Array<{ id: string; title: string; contentHash: string }>
  ): Promise<string> {
    let index: VersionsIndex;
    
    try {
      const raw = await fs.readFile(this.versionsPath, 'utf8');
      index = JSON.parse(raw);
    } catch {
      index = {
        version: "1.0.0",
        documentId,
        lastUpdated: new Date().toISOString(),
        nodes: []
      };
    }

    for (const node of nodes) {
      let nodeTimeline = index.nodes.find(n => n.nodeId === node.id);
      
      const newVersion: VersionEntry = {
        versionId: `v-${effectiveDate.replace(/-/g, '')}-${txId.substring(0, 6)}`,
        txId,
        effectiveDate,
        contentHash: node.contentHash,
        status: 'current'
      };

      if (!nodeTimeline) {
        index.nodes.push({
          nodeId: node.id,
          title: node.title,
          versions: [newVersion]
        });
      } else {
        // Marcar versiones anteriores como 'superseded'
        nodeTimeline.versions.forEach(v => {
          if (v.status === 'current') v.status = 'superseded';
        });
        nodeTimeline.versions.push(newVersion);
      }
    }

    index.lastUpdated = new Date().toISOString();
    await fs.mkdir(path.dirname(this.versionsPath), { recursive: true });
    await fs.writeFile(this.versionsPath, JSON.stringify(index, null, 2), 'utf8');
    
    console.log(`[VERSIONING] Memoria normativa actualizada para ${nodes.nodes?.length || nodes.length} nodos (TX: ${txId})`);
    return this.versionsPath;
  }
}
