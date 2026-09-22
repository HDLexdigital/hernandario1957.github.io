import { DiffEngineService } from './DiffEngineService';
import * as path from 'path';
import * as fs from 'fs/promises';

async function runTest() {
  console.log('--- INICIANDO PRUEBA DEL DIFF ENGINE (MVP-067) ---\n');
  const engine = new DiffEngineService();

  const text1 = "Artículo 13. Todas las personas nacen libres e iguales ante la ley y recibirán protección temporal.";
  const text2 = "Artículo 13. Todas las personas nacen libres e iguales ante la ley y recibirán protección especial.";

  const result = await engine.compareAndPersist(
    'art-13',
    'v1991',
    text1,
    'v2026',
    text2
  );

  console.log('\n[DIFF RESULT SUMMARY]:');
  result.changes.forEach(c => {
    if (c.type === 'added') console.log(`  🟢 [+] ${c.text}`);
    else if (c.type === 'removed') console.log(`  🔴 [-] ${c.text}`);
    else console.log(`      ${c.text}`);
  });

  const savedPath = path.resolve(process.cwd(), 'dist/indexes/diffs/art-13/v1991-v2026.json');
  const exists = await fs.stat(savedPath).catch(() => false);
  
  if (exists) {
    console.log('\n✅ ÉXITO: Artefacto de diff persistido inmutablemente en disco.');
  } else {
    console.error('\n❌ ERROR: No se encontró el artefacto de diff.');
  }
}

runTest();
