import { TransactionRegistryService } from './TransactionRegistryService';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runTests() {
  console.log('--- INICIANDO PRUEBAS DE INTEGRIDAD DEL LEDGER (MVP-065) ---\n');
  const registry = new TransactionRegistryService();
  const txId = 'tx-integrity-test-01';

  try {
    // 1. Crear transacción
    console.log('1. Creando nueva transacción (processing)...');
    await registry.createTransaction(txId, 'constitucion', 'hash-falso-123');

    // 2. Simular generación de un artefacto físico y adjuntar su huella criptográfica
    console.log('2. Calculando SHA-256 de un artefacto y adjuntándolo...');
    const dummyPath = path.resolve(process.cwd(), 'dist/dummy.txt');
    await fs.mkdir(path.dirname(dummyPath), { recursive: true });
    await fs.writeFile(dummyPath, 'Contenido legal inmutable', 'utf8');
    
    const record = await registry.computeArtifactRecord(dummyPath);
    await registry.attachArtifact(txId, 'xhtml', record);
    console.log(`   Hash generado: ${record.sha256}`);

    // 3. Probar la máquina de estados (Ruta Feliz)
    console.log('3. Transicionando a success...');
    await registry.transitionStatus(txId, 'success', ['Artefactos generados exitosamente.']);

    // 4. Probar la máquina de estados (Bloqueo de seguridad)
    console.log('4. Intentando transición ilegal (success -> failed)...');
    try {
      await registry.transitionStatus(txId, 'failed');
      console.error('❌ ERROR: La máquina de estados permitió una transición ilegal.');
    } catch (e: any) {
      console.log(`   ✅ Bloqueo exitoso: ${e.message}`);
    }

    console.log('\n✅ TODAS LAS PRUEBAS DE INTEGRIDAD SUPERADAS.');
  } catch (error) {
    console.error('❌ FALLO EN LAS PRUEBAS:', error);
  }
}

runTests();
