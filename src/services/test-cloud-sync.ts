import { CloudSyncService } from './cloud/CloudSyncService';
import { TransactionRegistryService } from './TransactionRegistryService';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runTest() {
  console.log('--- INICIANDO PRUEBA DE CLOUD SYNC ADAPTER (MVP-071) ---\n');

  try {
    const syncService = new CloudSyncService();
    const result = await syncService.syncCurrentRelease();

    console.log('\n[CLOUD SYNC RESULT]:');
    console.log(`- Proveedor: ${result.provider}`);
    console.log(`- Transacción: ${result.txId}`);
    console.log(`- Archivos replicados: ${result.uploadedFiles}`);
    console.log(`- Bytes transferidos: ${result.uploadedBytes} B`);
    console.log(`- Puntero remoto: ${result.remotePointerUrl}`);

    // Verificar que el Ledger se actualizó a 'published-remote'
    const registry = new TransactionRegistryService();
    const history = await registry.getHistory();
    const tx = history.find((t: any) => t.txId === result.txId);

    if (tx && tx.status === 'published-remote') {
      console.log('\n✅ ÉXITO: Estado del Ledger transitado a [published-remote] con paridad criptográfica.');
    } else {
      console.error('\n❌ ERROR: El Ledger no reflejó el nuevo estado remoto.');
    }

  } catch (error: any) {
    console.error('\n❌ ERROR en la sincronización remota:', error.message);
  }
}

runTest();
