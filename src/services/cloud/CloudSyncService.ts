import * as fs from 'fs/promises';
import * as path from 'path';
import { CloudSyncAdapter, CloudSyncResult } from './CloudSyncAdapter';
import { LocalMirrorAdapter } from './LocalMirrorAdapter';
import { TransactionRegistryService } from '../TransactionRegistryService';

export class CloudSyncService {
  private adapter: CloudSyncAdapter;
  private registry = new TransactionRegistryService();

  constructor(adapter?: CloudSyncAdapter) {
    // Por defecto usa el adaptador LocalMirror (seguro y sin credenciales obligatorias)
    this.adapter = adapter || new LocalMirrorAdapter();
  }

  public async syncCurrentRelease(): Promise<CloudSyncResult> {
    console.log(`[CLOUD-SYNC] Iniciando protocolo de sincronización remota vía [${this.adapter.providerName}]...`);

    // 1. Validar que exista una release local aprobada (current.json)
    const currentReleasePath = path.resolve(process.cwd(), 'dist/releases/current.json');
    const currentRaw = await fs.readFile(currentReleasePath, 'utf8').catch(() => null);
    if (!currentRaw) {
      throw new Error("[CLOUD-SYNC] No existe una release local activa (dist/releases/current.json). Ejecute PublishWorker primero.");
    }

    const currentRelease = JSON.parse(currentRaw);
    const txId = currentRelease.activeTxId;

    // 2. Obtener transacción del Ledger para extraer artefactos y hashes
    const history = await this.registry.getHistory();
    const transactions = Array.isArray(history) ? history : (history.transactions || []);
    const transaction = transactions.find((t: any) => t.txId === txId);

    if (!transaction) {
      throw new Error(`[CLOUD-SYNC] La transacción de release ${txId} no se encuentra en el Ledger.`);
    }

    // 3. Ejecutar sincronización a través del adaptador
    const syncResult = await this.adapter.publishRelease(txId, transaction.artifacts || {});

    // 4. Actualizar Ledger con el estado 'published-remote'
    await this.registry.transitionStatus(txId, 'published-remote', [
      `Sincronización remota exitosa en proveedor [${this.adapter.providerName}]`,
      `Puntero remoto activo: ${syncResult.remotePointerUrl}`
    ]);

    console.log(`[CLOUD-SYNC] ☁️ Release [${txId}] replicada exitosamente en producción remota.`);
    return syncResult;
  }
}
