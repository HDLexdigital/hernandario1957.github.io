import { ImpactAnalyzerService } from './ImpactAnalyzerService';
import * as path from 'path';
import * as fs from 'fs/promises';

async function runTest() {
  console.log('--- INICIANDO PRUEBA DEL IMPACT ANALYZER (MVP-068) ---\n');
  const analyzer = new ImpactAnalyzerService();

  const report = await analyzer.analyzeAndPersist();

  console.log('[IMPACT REPORT SUMMARY]:');
  console.log(`- Total de nodos analizados: ${report.totalAnalyzedNodes}`);
  console.log(`- Índice global de reformas: ${report.globalStabilityIndex}`);
  console.log('\n[RANKING DE MUTACIÓN NORMATIVA]:');
  
  report.mostMutatedArticles.forEach((art, index) => {
    console.log(`  ${index + 1}. [${art.nodeId}] ${art.title} -> Reformas: ${art.totalReforms} (Última: ${art.lastReformDate})`);
  });

  const savedPath = path.resolve(process.cwd(), 'dist/indexes/impact-metrics.json');
  const exists = await fs.stat(savedPath).catch(() => false);

  if (exists) {
    console.log('\n✅ ÉXITO: Artefacto de métricas de impacto persistido inmutablemente en disco.');
  } else {
    console.error('\n❌ ERROR: No se encontró el artefacto de métricas.');
  }
}

runTest();
