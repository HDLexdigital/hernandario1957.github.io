import * as fs from 'fs/promises';
import { CrossCorpusResolver } from './cross-corpus/CrossCorpusResolver';
import { CorporaPathResolver } from './corpora/CorporaPathResolver';

async function runCrossCorpusSuite() {
  console.log('--- INICIANDO SUITE DE ENLACES INTER-NORMATIVOS (MVP-072.2) ---\n');

  const resolver = new CrossCorpusResolver();

  // 1. Preparar versiones simuladas en el corpus destino (Constitución)
  const constIndexesDir = CorporaPathResolver.getIndexesDir('constitucion');
  await fs.mkdir(constIndexesDir, { recursive: true });

  const mockConstitutionVersions = {
    corpusId: 'co-constitucion-1991',
    nodes: [
      { nodeId: 'art-29', title: 'Artículo 29. Debido proceso' },
      { nodeId: 'art-86', title: 'Artículo 86. Acción de tutela' }
    ]
  };

  await fs.writeFile(
    CorporaPathResolver.getVersionsPath('constitucion'),
    JSON.stringify(mockConstitutionVersions, null, 2),
    'utf8'
  );
  console.log('1. versions.json de Constitución aprovisionado con Art. 29 y Art. 86.');

  // 2. Redacción típica de un artículo del Código Civil con citas constitucionales
  const sampleArticleText = `
    Toda persona podrá reclamar la indemnización de perjuicios sin perjuicio de la
    acción consagrada en el artículo 86 de la Constitución. Asimismo, los trámites
    se adelantarán respetando el debido proceso establecido en el art. 29 superior.
    Cualquier reclamo adicional se formulará según el artículo 999 de la Carta Política.
  `;

  const sourceGlobalId = 'co:codigo-civil:art:2341';
  console.log(`2. Procesando citas cruzadas para el nodo origen: [${sourceGlobalId}]...`);

  const results = await resolver.resolveTextCitations(sourceGlobalId, sampleArticleText);

  console.log(`\nCitas detectadas: ${results.length}`);
  results.forEach((ref, idx) => {
    const icon = ref.isLive ? '✅ [CITA VIVA]' : '⚠️ [CITA ROTA / FANTASMA]';
    console.log(`\n--- Referencia #${idx + 1} ${icon} ---`);
    console.log(`- Texto extraído:    "${ref.rawCitation}"`);
    console.log(`- Target Global ID:  ${ref.targetGlobalId}`);
    console.log(`- Ruta Web:          ${ref.targetPath}`);
    console.log(`- Tipo de Vínculo:   ${ref.citationType}`);
    console.log(`- Estado en Destino: ${ref.isLive ? 'Nodo confirmado en versions.json' : 'Nodo NO existe en versions.json'}`);
  });

  // 3. Verificación de invariantes
  const ref86 = results.find(r => r.targetGlobalId === 'co:constitucion:art:86');
  const ref29 = results.find(r => r.targetGlobalId === 'co:constitucion:art:29');
  const ref999 = results.find(r => r.targetGlobalId === 'co:constitucion:art:999');

  if (!ref86 || !ref86.isLive) {
    throw new Error('❌ Falla: El Art. 86 no fue detectado o no se validó como cita viva.');
  }

  if (!ref29 || !ref29.isLive) {
    throw new Error('❌ Falla: El Art. 29 superior no fue resuelto como cita viva.');
  }

  if (!ref999 || ref999.isLive) {
    throw new Error('❌ Falla: El Art. 999 debía marcarse como cita rota (isLive = false).');
  }

  // 4. Persistir registro global
  await resolver.saveReferences(results);
  console.log('\n✅ ÉXITO: Aristas inter-normativas auditadas y persistidas en dist/corpora/global-registry.json.');

  console.log('\n======================================================');
  console.log('✅ VEREDICTO: MOTOR DE ENLACES INTER-NORMATIVOS OPERATIVO');
  console.log('======================================================');
}

runCrossCorpusSuite();
