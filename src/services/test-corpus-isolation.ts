import * as fs from 'fs/promises';
import * as path from 'path';
import { CorpusRegistryService } from './corpora/CorpusRegistryService';
import { CorporaPathResolver } from './corpora/CorporaPathResolver';

async function runIsolationSuite() {
  console.log('\n--- INICIANDO SUITE DE PRUEBAS DE AISLAMIENTO MULTI-TENANT (MVP-072) ---\n');

  const registryService = new CorpusRegistryService();

  console.log('1. Registrando segundo corpus: Código Civil de Colombia...');
  await registryService.registerCorpus({
    corpusId: 'co-codigo-civil',
    slug: 'codigo-civil',
    title: 'Código Civil Colombiano',
    shortTitle: 'CC',
    jurisdiction: 'CO',
    type: 'code',
    promulgationDate: '1887-05-26',
    activeRelease: null,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const registry = await registryService.getRegistry();
  if (!registry.corpora['co-codigo-civil'] || !registry.corpora['co-constitucion-1991']) {
    throw new Error('❌ Falla: El registro maestro no contiene ambos corpora.');
  }
  console.log('✅ Aislamiento de Registro: Ambos corpora coexisten en registry.json.');

  const dirConst = CorporaPathResolver.getCorpusDir('constitucion');
  const dirCivil = CorporaPathResolver.getCorpusDir('codigo-civil');

  await fs.mkdir(CorporaPathResolver.getBuildsDir('codigo-civil'), { recursive: true });
  await fs.mkdir(CorporaPathResolver.getReleasesDir('codigo-civil'), { recursive: true });

  console.log('\n2. Verificando rutas físicas aisladas:');
  console.log(`   - Directorio Constitución: ${dirConst}`);
  console.log(`   - Directorio Código Civil: ${dirCivil}`);

  if (dirConst === dirCivil) {
    throw new Error('❌ Falla crítica: Colisión de rutas entre corpora.');
  }

  const txCivil = 'tx-civil-999';
  const historyCivilPath = CorporaPathResolver.getHistoryPath('codigo-civil');
  await fs.writeFile(historyCivilPath, JSON.stringify([{ txId: txCivil, status: 'success' }], null, 2), 'utf8');

  const historyConstRaw = await fs.readFile(CorporaPathResolver.getHistoryPath('constitucion'), 'utf8').catch(() => '[]');
  let constTxs: any[] = [];
  try {
    const parsed = JSON.parse(historyConstRaw);
    constTxs = Array.isArray(parsed) ? parsed : (parsed.transactions || []);
  } catch {
    constTxs = [];
  }

  const hasLeak = constTxs.some((t: any) => t.txId === txCivil);
  if (hasLeak) {
    throw new Error('❌ Falla crítica: Transacción de Código Civil filtrada en el Ledger de la Constitución.');
  }
  console.log('✅ Aislamiento de Ledger: Las transacciones se mantienen estrictamente contenidas.');

  const releaseCivilPath = path.resolve(CorporaPathResolver.getReleasesDir('codigo-civil'), 'current.json');
  await fs.writeFile(releaseCivilPath, JSON.stringify({ activeTxId: txCivil, publishedAt: new Date().toISOString() }), 'utf8');

  const releaseConstPath = path.resolve(CorporaPathResolver.getReleasesDir('constitucion'), 'current.json');
  const releaseConstRaw = await fs.readFile(releaseConstPath, 'utf8').catch(() => null);
  const releaseConst = releaseConstRaw ? JSON.parse(releaseConstRaw) : null;

  if (releaseConst && releaseConst.activeTxId === txCivil) {
    throw new Error('❌ Falla crítica: El release de Código Civil sobrescribió el de la Constitución.');
  }
  console.log('✅ Aislamiento de Release: Los punteros de producción son completamente independientes.');

  console.log('\n======================================================');
  console.log('✅ VEREDICTO: INFRAESTRUCTURA MULTI-TENANT VERIFICADA');
  console.log('======================================================');
}

runIsolationSuite();
