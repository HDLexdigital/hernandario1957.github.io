import { VersioningService } from './VersioningService';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runTest() {
  console.log('--- INICIANDO PRUEBA DE MEMORIA NORMATIVA (MVP-066) ---\n');
  const service = new VersioningService();

  // Simulamos versión inicial (1991)
  await service.registerTransactionVersions(
    'constitucion',
    'tx-1991-init',
    '1991-07-04',
    [{ id: 'art13', title: 'Artículo 13 Original', contentHash: 'hash1991abc' }]
  );

  // Simulamos una reforma posterior (2025) que reemplaza la anterior
  await service.registerTransactionVersions(
    'constitucion',
    'tx-2025-reforma',
    '2025-02-10',
    [{ id: 'art13', title: 'Artículo 13 Reformado', contentHash: 'hash2025xyz' }]
  );

  // Verificamos el artefacto generado
  const versionsPath = path.resolve(process.cwd(), 'dist/indexes/versions.json');
  const content = await fs.readFile(versionsPath, 'utf8');
  const parsed = JSON.parse(content);

  console.log('\n[VERSIONS JSON OUTPUT]:');
  console.log(JSON.stringify(parsed, null, 2));

  const art13 = parsed.nodes.find((n: any) => n.nodeId === 'art13');
  if (art13 && art13.versions.length === 2) {
    console.log('\n✅ ÉXITO: Línea de tiempo cronológica del Artículo 13 validada correctamente.');
  } else {
    console.error('\n❌ ERROR: La estructura de versiones no coincide con lo esperado.');
  }
}

runTest();
