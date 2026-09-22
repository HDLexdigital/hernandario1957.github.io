import { PublishWorker } from './PublishWorker';
import { CloudSyncService } from './cloud/CloudSyncService';
import { RollbackWorker } from './RollbackWorker';
import { TransactionRegistryService } from './TransactionRegistryService';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runTest() {
  console.log('--- INICIANDO PRUEBA DE ROLLBACK REMOTO (MVP-071.2) ---\n');

  const registry = new TransactionRegistryService();
  const publisher = new PublishWorker();
  const syncer = new CloudSyncService();
  const rollbackWorker = new RollbackWorker();

  // Helper para crear un build rápido y válido
  async function createMockBuild(txId: string, content: string) {
    const txDir = path.resolve(process.cwd(), `dist/builds/${txId}/xhtml`);
    await fs.mkdir(txDir, { recursive: true });
    const filePath = path.resolve(txDir, 'index.xhtml');
    await fs.writeFile(filePath, `<html><body><h1>${content}</h1></body></html>`, 'utf8');

    await registry.initTransaction(txId);
    const record = await registry.computeArtifactRecord(filePath);
    await registry.attachArtifact(txId, 'xhtml', record);
    await registry.transitionStatus(txId, 'success', ['Build exitoso.']);
  }

  // 1. Preparar Release Estable (A)
  const txA = `tx-stable-${Date.now()}`;
  console.log(`1. Creando y publicando Release Estable: [${txA}]...`);
  await createMockBuild(txA, 'Versión Estable 1.0');
  await publisher.publishBuild(txA, 'Editor Senior');
  await syncer.syncCurrentRelease();

  // 2. Preparar Release con Defecto (B)
  const txB = `tx-defect-${Date.now() + 10}`;
  console.log(`2. Creando y publicando Release con Defecto: [${txB}]...`);
  await createMockBuild(txB, 'Versión con Errores 2.0');
  await publisher.publishBuild(txB, 'Editor Trainee');
  await syncer.syncCurrentRelease();

  // 3. Ejecutar Rollback Remoto
  console.log('\n3. Ejecutando Rollback Remoto...');
  const rollbackResult = await rollbackWorker.executeRemoteRollback('Hernán Durango (Admin)');
  console.log('[ROLLBACK RESULT]:', rollbackResult);

  // 4. Verificación de Integridad de Punteros
  const remoteCurrentPath = path.resolve(process.cwd(), 'dist/cloud-mirror/current.json');
  const remoteCurrent = JSON.parse(await fs.readFile(remoteCurrentPath, 'utf8'));

  const localCurrentPath = path.resolve(process.cwd(), 'dist/releases/current.json');
  const localCurrent = JSON.parse(await fs.readFile(localCurrentPath, 'utf8'));

  console.log('\n--- VERIFICACIÓN POST-ROLLBACK ---');
  console.log(`- Puntero Remoto Activo: [${remoteCurrent.activeTxId}] (Esperado: ${txA})`);
  console.log(`- Puntero Local Activo:  [${localCurrent.activeTxId}] (Esperado: ${txA})`);

  // 5. Verificación de Estados en el Ledger
  const history = await registry.getHistory();
  const txBRecord = history.find((t: any) => t.txId === txB);
  const txARecord = history.find((t: any) => t.txId === txA);

  const isRemoteValid = remoteCurrent.activeTxId === txA;
  const isLedgerValid = txBRecord?.status === 'rolled-back' && txARecord?.status === 'published-remote';

  if (isRemoteValid && isLedgerValid) {
    console.log('\n✅ ÉXITO TOTAL: Punteros conmutados, paridad restaurada y Ledger en estado [rolled-back].');
  } else {
    console.error('\n❌ ERROR: Falla de paridad o estados incorrectos en el Ledger.');
  }
}

runTest();
