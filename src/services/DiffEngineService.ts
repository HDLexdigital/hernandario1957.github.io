import * as fs from 'fs/promises';
import * as path from 'path';

export interface DiffChange {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

export interface DiffResult {
  nodeId: string;
  fromVersion: string;
  toVersion: string;
  changes: DiffChange[];
  generatedAt: string;
}

export class DiffEngineService {
  private readonly diffsBaseDir: string;

  constructor() {
    this.diffsBaseDir = path.resolve(process.cwd(), 'dist/indexes/diffs');
  }

  /**
   * Algoritmo de diff simple a nivel de palabras para textos normativos.
   */
  public computeWordDiff(oldText: string, newText: string): DiffChange[] {
    const oldWords = oldText.split(/\s+/);
    const newWords = newText.split(/\s+/);
    const changes: DiffChange[] = [];

    // Implementación base robusta de comparación por tokens
    let i = 0, j = 0;
    while (i < oldWords.length || j < newWords.length) {
      if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
        changes.push({ type: 'unchanged', text: oldWords[i] });
        i++;
        j++;
      } else {
        if (i < oldWords.length) {
          changes.push({ type: 'removed', text: oldWords[i] });
          i++;
        }
        if (j < newWords.length) {
          changes.push({ type: 'added', text: newWords[j] });
          j++;
        }
      }
    }
    return changes;
  }

  /**
   * Genera, persiste y devuelve el diff entre dos versiones de un nodo.
   */
  public async compareAndPersist(
    nodeId: string, 
    fromVersion: string, 
    oldText: string, 
    toVersion: string, 
    newText: string
  ): Promise<DiffResult> {
    const changes = this.computeWordDiff(oldText, newText);
    
    const result: DiffResult = {
      nodeId,
      fromVersion,
      toVersion,
      changes,
      generatedAt: new Date().toISOString()
    };

    const nodeDiffDir = path.resolve(this.diffsBaseDir, nodeId);
    await fs.mkdir(nodeDiffDir, { recursive: true });
    
    const diffFilePath = path.resolve(nodeDiffDir, `${fromVersion}-${toVersion}.json`);
    await fs.writeFile(diffFilePath, JSON.stringify(result, null, 2), 'utf8');

    console.log(`[DIFF-ENGINE] Diff generado para [${nodeId}] (${fromVersion} -> ${toVersion})`);
    return result;
  }
}
