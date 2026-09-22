import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export class TransactionRegistryService {
  private historyPath = path.resolve(process.cwd(), 'dist/builds/history.json');

  public async getHistory(): Promise<any[]> {
    try {
      const raw = await fs.readFile(this.historyPath, 'utf8');
      const parsed = JSON.parse(raw);
      // Soporta tanto array puro como { transactions: [] }
      return Array.isArray(parsed) ? parsed : (parsed.transactions || []);
    } catch {
      return [];
    }
  }

  private async saveHistory(transactions: any[]): Promise<void> {
    await fs.mkdir(path.dirname(this.historyPath), { recursive: true });
    // Siempre guardamos como Array puro
    await fs.writeFile(this.historyPath, JSON.stringify(transactions, null, 2), 'utf8');
  }

  public async initTransaction(txId: string): Promise<void> {
    const txs = await this.getHistory();
    txs.push({ txId, timestamp: new Date().toISOString(), status: 'processing', artifacts: {}, logs: [] });
    await this.saveHistory(txs);
  }

  public async attachArtifact(txId: string, name: string, record: any): Promise<void> {
    const txs = await this.getHistory();
    const tx = txs.find(t => t.txId === txId);
    if (!tx) throw new Error(`Transacción ${txId} no encontrada.`);
    tx.artifacts = tx.artifacts || {};
    tx.artifacts[name] = record;
    await this.saveHistory(txs);
  }

  public async transitionStatus(txId: string, status: string, logs: string[]): Promise<void> {
    const txs = await this.getHistory();
    const tx = txs.find(t => t.txId === txId);
    if (!tx) throw new Error(`Transacción ${txId} no encontrada.`);
    tx.status = status;
    tx.logs = (tx.logs || []).concat(logs);
    await this.saveHistory(txs);
  }

  public async computeArtifactRecord(filePath: string): Promise<any> {
    const buffer = await fs.readFile(filePath);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const stats = await fs.stat(filePath);
    return { path: filePath, sha256, sizeBytes: stats.size, generatedAt: new Date().toISOString() };
  }
}
