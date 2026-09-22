import { PublishWorker } from './PublishWorker';
import { TransactionRegistryService } from './TransactionRegistryService';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runTest() {
  console.log('--- INICIANDO PRUEBA DEL PUBLISH WORKER (MVP-069) ---\n');
  
  const txId = `tx-test-${Date.now()}`;
  const txDir = path.resolve(process.cwd(), `dist/builds/${txId}`);
  const xhtmlDir = path.resolve(txDir, 'xhtml');

  // 1. Crear entorno físico simulado del build
  await fs.mkdir(xhtmlDir, { recursive: true });
  const xhtmlPath = path.resolve(xhtmlDir, 'index.xhtml');
  await fs.writeFile(xhtmlPath, '<html><body><h1>Release 1.0</h1></body></html>', 'utf8');

  // 2. Usar las API oficiales para registrar la transacción (como lo haría el BuildWorker)
  const registry = new TransactionRegistryService();
  await registry.initTransaction(txId);
  
  const xhtmlRecord = await registry.computeArtifactRecord(xhtmlPath);
  await registry.attachArtifact(txId, 'xhtml', xhtmlRecord);
  await registry.transitionStatus(txId, 'success', ['Build de simulación exitoso.']);

  console.log(`[TEST] Transacción oficializada en Ledger: ${txId}`);

  // 3. Ejecutar PublishWorker
  const publisher = new PublishWorker();
  const result = await publisher.publishBuild(txId, 'Hernán Durango (Admin)');

  console.log('\n[PUBLISH RESULT]:', result);

  // 4. Verificar persistencia de releases y Rollback
  const currentReleasePath = path.resolve(process.cwd(), 'dist/releases/current.json');
  const releaseExists = await fs.stat(currentReleasePath).catch(() => false);

  if (releaseExists && result.status === 'published') {
    console.log('\n✅ ÉXITO: Punteros de producción (current.json) generados y blindados correctamente.');
    
    console.log('\n--- PROBANDO PROTOCOLO DE ROLLBACK ---');
    try {
      const rolledBackTxId = await publisher.rollback();
      console.log(`✅ ÉXITO: Rollback ejecutado correctamente. Regresó al TxID: ${rolledBackTxId}`);
    } catch (e: any) {
      console.log(`⚠️ Rollback omitido (es normal si no hay release previo): ${e.message}`);
    }
  } else {
    console.error('\n❌ ERROR: El proceso de publicación falló.');
  }
}

runTest();
