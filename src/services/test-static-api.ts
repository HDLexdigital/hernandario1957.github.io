import * as fs from 'fs/promises';
import * as path from 'path';
import { StaticApiGeneratorService } from './api/StaticApiGeneratorService';

async function runStaticApiSuite() {
  console.log('--- INICIANDO SUITE DE API PÚBLICA HEADLESS (MVP-073.1) ---\n');

  const generator = new StaticApiGeneratorService();
  const result = await generator.compileAll();

  console.log(`\n1. Endpoints compilados reportados: ${result.totalEndpointsGenerated}`);
  if (result.totalEndpointsGenerated === 0) {
    throw new Error('❌ Falla: No se generó ningún endpoint.');
  }

  // 2. Verificar Corpora Catalog
  const corporaPath = path.resolve(process.cwd(), 'dist/api/v1/corpora.json');
  const corporaRaw = await fs.readFile(corporaPath, 'utf8');
  const corporaData = JSON.parse(corporaRaw);

  console.log(`2. Corpora registrados en API: ${corporaData.corpora.length}`);
  if (!corporaData.meta.sourceGraphSha256) {
    throw new Error('❌ Falla: Falta hash de procedencia en corpora.json');
  }

  // 3. Verificar Centrality Metrics
  const metricsPath = path.resolve(process.cwd(), 'dist/api/v1/metrics/centrality.json');
  const metricsRaw = await fs.readFile(metricsPath, 'utf8');
  const metricsData = JSON.parse(metricsRaw);

  console.log(`3. Centralidad auditada: Top node es ${metricsData.topCentralNodes[0].globalId}`);
  if (!metricsData.meta.computationalDisclaimer) {
    throw new Error('❌ Falla: Falta computationalDisclaimer obligatorio en métricas.');
  }

  // 4. Verificar Endpoint Resolve para co:constitucion:art:86
  const resolveArt86Path = path.resolve(process.cwd(), 'dist/api/v1/resolve/co/constitucion/art/86.json');
  const art86Raw = await fs.readFile(resolveArt86Path, 'utf8');
  const art86Data = JSON.parse(art86Raw);

  console.log(`4. Resolución canónica verificada para: ${art86Data.node.globalId}`);
  console.log(`   - Citas entrantes detectadas: ${art86Data.references.inbound.length}`);
  if (art86Data.references.inbound.length === 0) {
    throw new Error('❌ Falla: El Art. 86 debía registrar la cita entrante del Código Civil.');
  }

  // 5. Verificar Endpoint Impact para co:constitucion:art:86
  const impactArt86Path = path.resolve(process.cwd(), 'dist/api/v1/impact/co/constitucion/art/86.json');
  const impactRaw = await fs.readFile(impactArt86Path, 'utf8');
  const impactData = JSON.parse(impactRaw);

  console.log(`5. Simulación de impacto estático verificada para: ${impactData.simulation.evaluatedGlobalId}`);
  console.log(`   - Total dependientes: ${impactData.simulation.totalDependentsAffected}`);
  console.log('   - Distribución:', impactData.simulation.corpusDistribution);

  if (impactData.simulation.totalDependentsAffected !== 2) {
    throw new Error('❌ Falla: El Art. 86 debía impactar a 2 dependientes en cascada.');
  }

  console.log('\n======================================================');
  console.log('✅ VEREDICTO: GENERADOR ESTÁTICO DE API PÚBLICA 100% OPERATIVO');
  console.log('======================================================');
}

runStaticApiSuite();
