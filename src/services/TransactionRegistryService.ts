import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export type TxStatus = 'processing' | 'success' | 'failed' | 'published';

export interface ArtifactRecord {
  path: string;
  sha256: string;
  sizeBytes: number;
}

export interface ArtifactLedger {
  xhtml?: ArtifactRecord;
  pdf?: ArtifactRecord;
  toc?: ArtifactRecord;
  search?: ArtifactRecord;
  graph?: ArtifactRecord;
}

export interface TransactionRecord {
  txId: string;
  documentId: string;
  timestamp: string;
  sourceHash: string;
  status: TxStatus;
  executionTimeMs: number;
  artifacts: ArtifactLedger;
  logs: string[];
}

export interface TransactionRegistry {
  version: "1.0.0";
  lastUpdate: string;
  transactions: TransactionRecord[];
}

export class TransactionRegistryService {
  private readonly historyPath: string;

  constructor() {
    this.historyPath = path.resolve(process.cwd(), 'dist/indexes/history.json');
  }

  /**
   * Inicializa el ledger si no existe.
   */
  private async ensureLedger(): Promise<TransactionRegistry> {
    try {
      const data = await fs.readFile(this.historyPath, 'utf8');
      return JSON.parse(data) as TransactionRegistry;
    } catch (error) {
      const initial: TransactionRegistry = { version: "1.0.0", lastUpdate: new Date().toISOString(), transactions: [] };
      await fs.mkdir(path.dirname(this.historyPath), { recursive: true });
      await this.saveLedger(initial);
      return initial;
    }
  }

  private async saveLedger(ledger: TransactionRegistry): Promise<void> {
    ledger.lastUpdate = new Date().toISOString();
    await fs.writeFile(this.historyPath, JSON.stringify(ledger, null, 2), 'utf8');
  }

  /**
   * Calcula el hash SHA-256 y el peso de un archivo físico.
   */
  public async computeArtifactRecord(filePath: string): Promise<ArtifactRecord> {
    const buffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);
    return {
      path: filePath,
      sha256: hashSum.digest('hex'),
      sizeBytes: buffer.length
    };
  }

  public async createTransaction(txId: string, documentId: string, sourceHash: string): Promise<TransactionRecord> {
    const ledger = await this.ensureLedger();
    const newTx: TransactionRecord = {
      txId,
      documentId,
      timestamp: new Date().toISOString(),
      sourceHash,
      status: 'processing',
      executionTimeMs: 0,
      artifacts: {},
      logs: ['Transacción iniciada.']
    };
    ledger.transactions.push(newTx);
    await this.saveLedger(ledger);
    return newTx;
  }

  /**
   * Máquina de estados estricta.
   */
  public async transitionStatus(txId: string, newStatus: TxStatus, logs: string[] = []): Promise<void> {
    const ledger = await this.ensureLedger();
    const tx = ledger.transactions.find(t => t.txId === txId);
    
    if (!tx) throw new Error(`Transacción ${txId} no encontrada.`);

    const validTransitions: Record<TxStatus, TxStatus[]> = {
      'processing': ['success', 'failed'],
      'success': ['published'],
      'failed': [],
      'published': []
    };

    if (!validTransitions[tx.status].includes(newStatus)) {
      throw new Error(`Transición inválida: No se puede pasar de '${tx.status}' a '${newStatus}'.`);
    }

    tx.status = newStatus;
    if (logs.length > 0) tx.logs.push(...logs);
    
    await this.saveLedger(ledger);
  }

  public async attachArtifact(txId: string, artifactType: keyof ArtifactLedger, record: ArtifactRecord): Promise<void> {
    const ledger = await this.ensureLedger();
    const tx = ledger.transactions.find(t => t.txId === txId);
    if (!tx) throw new Error(`Transacción ${txId} no encontrada.`);
    if (tx.status !== 'processing') throw new Error(`No se pueden adjuntar artefactos en estado ${tx.status}.`);

    tx.artifacts[artifactType] = record;
    await this.saveLedger(ledger);
  }

  public async getHistory(): Promise<TransactionRecord[]> {
    const ledger = await this.ensureLedger();
    return ledger.transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
