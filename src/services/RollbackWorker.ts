import * as fs from 'fs/promises';
import * as path from 'path';
import { CloudSyncAdapter } from './cloud/CloudSyncAdapter';
import { LocalMirrorAdapter } from './cloud/LocalMirrorAdapter';
import { TransactionRegistryService } from './TransactionRegistryService';

export interface RollbackResult {
  success: boolean;
  rolledBackTxId: string;
  restoredTxId: string;
  provider: string;
  timestamp: string;
  message: string;
}

export class RollbackWorker {
  private adapter: CloudSyncAdapter;
  private registry = new TransactionRegistryService();
  private releasesDir = path.resolve(process.cwd(), 'dist/releases');

  constructor(adapter?: CloudSyncAdapter) {
    this.adapter = adapter || new LocalMirrorAdapter();
  }

  /**
   * Ejecuta el protocolo de rollback atómico tanto local como remoto.
   */
  public async executeRemoteRollback(authorizedBy: string = 'Editorial-Admin'): Promise<RollbackResult> {
    const currentPath = path.resolve(this.releasesDir, 'current.json');
    const previousPath = path.resolve(this.releasesDir, 'previous.json');

    // 1. Validar existencia del puntero actual y del respaldo previo
    const currentRaw = await fs.readFile(currentPath, 'utf8').catch(() => null);
    const previousRaw = await fs.readFile(previousPath, 'utf8').catch(() => null);

    if (!currentRaw || !previousRaw) {
      throw new Error("[ROLLBACK] Imposible ejecutar reversión: Se requiere tanto current.json como previous.json.");
    }

    const currentData = JSON.parse(currentRaw);
    const previousData = JSON.parse(previousRaw);

    const badTxId = currentData.activeTxId;
    const targetTxId = previousData.activeTxId;

    if (badTxId === targetTxId) {
      throw new Error(`[ROLLBACK] El release actual y el previo tienen el mismo TxID (${targetTxId}). Abortando.`);
    }

    console.log(`[ROLLBACK-WORKER] Reversión iniciada: retirando [${badTxId}] -> restaurando [${targetTxId}]...`);

    // 2. Conmutar puntero remoto en la nube vía CloudSyncAdapter
    await this.adapter.rollbackRelease(targetTxId);

    // 3. Conmutar punteros locales atómicamente
    // current.json pasa a apuntar a targetTxId
    const restoredTimestamp = new Date().toISOString();
    const newCurrent = {
      activeTxId: targetTxId,
      publishedAt: restoredTimestamp,
      environment: 'production',
      restoredFromRollbackOf: badTxId,
      authorizedBy
    };

    await fs.writeFile(currentPath, JSON.stringify(newCurrent, null, 2), 'utf8');

    // 4. Actualizar Ledger con la máquina de estados
    // A. Marcar el release defectuoso como 'rolled-back'
    await this.registry.transitionStatus(badTxId, 'rolled-back', [
      `Transacción retirada de producción remota vía Rollback por [${authorizedBy}].`,
      `Puntero restaurado hacia: ${targetTxId}`
    ]);

    // B. Re-afirmar el target como 'published-remote'
    await this.registry.transitionStatus(targetTxId, 'published-remote', [
      `Transacción re-activada como producción activa tras rollback de [${badTxId}].`
    ]);

    console.log(`[ROLLBACK-WORKER] 🔄 Rollback completado con éxito. Activo remoto y local: [${targetTxId}]`);

    return {
      success: true,
      rolledBackTxId: badTxId,
      restoredTxId: targetTxId,
      provider: this.adapter.providerName,
      timestamp: restoredTimestamp,
      message: `Rollback completado. Sistema restaurado a TX: ${targetTxId}`
    };
  }
}
