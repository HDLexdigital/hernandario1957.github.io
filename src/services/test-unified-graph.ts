import * as fs from 'fs/promises';
import { UnifiedGraphService } from './corpora/UnifiedGraphService';
import { CorpusRegistryService } from './corpora/CorpusRegistryService';
import { CorporaPathResolver } from './corpora/CorporaPathResolver';

async function runUnifiedGraphSuite() {
  console.log('--- INICIANDO SUITE DE GRAFO JURÍDICO UNIFICADO (MVP-072.3) ---\n');

  const registryService = new CorpusRegistryService();

  // 1. Asegurar registro de tres corpora en el catálogo maestro
  console.log('1. Aprovisionando catálogo con Constitución, Código Civil y CGP...');
  await registryService.registerCorpus({
    corpusId: 'co-constitucion-1991',
    slug: 'constitucion',
    title: 'Constitución Política de Colombia',
    shortTitle: 'CP',
    jurisdiction: 'CO',
    type: 'constitution',
    promulgationDate: '1991-07-04',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  await registryService.registerCorpus({
    corpusId: 'co-codigo-civil',
    slug: 'codigo-civil',
    title: 'Código Civil Colombiano',
    shortTitle: 'CC',
    jurisdiction: 'CO',
    type: 'code',
    promulgationDate: '1887-05-26',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  await registryService.registerCorpus({
    corpusId: 'co-cgp',
    slug: 'cgp',
    title: 'Código General del Proceso',
    shortTitle: 'CGP',
    jurisdiction: 'CO',
    type: 'code',
    promulgationDate: '2012-07-12',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // 2. Sembrar versions.json para cada uno
  const writeVersions = async (slug: string, nodes: any[]) => {
    const dir = CorporaPathResolver.getIndexesDir(slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      CorporaPathResolver.getVersionsPath(slug),
      JSON.stringify({ corpusSlug: slug, nodes }, null, 2),
      'utf8'
    );
  };

  await writeVersions('constitucion', [
    { nodeId: 'art-86', title: 'Artículo 86. Acción de tutela' },
    { nodeId: 'art-29', title: 'Artículo 29. Debido proceso' }
  ]);

  await writeVersions('codigo-civil', [
    { nodeId: 'art-2341', title: 'Artículo 2341. Reparación por delito o culpa' }
  ]);

  await writeVersions('cgp', [
    { nodeId: 'art-1', title: 'Artículo 1. Objeto y aplicación' }
  ]);

  // 3. Sembrar aristas inter-normativas en global-registry.json
  const globalRegistryPath = 'dist/corpora/global-registry.json';
  const mockGlobalRegistry = {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    aliases: [],
    edges: [
      // CC Art. 2341 -> CP Art. 86
      {
        sourceGlobalId: 'co:codigo-civil:art:2341',
        targetGlobalId: 'co:constitucion:art:86',
        rawCitation: 'artículo 86 de la Constitución',
        citationType: 'constitutional_basis',
        isLive: true,
        detectedAt: new Date().toISOString()
      },
      // CGP Art. 1 -> CC Art. 2341 (Cadena de profundidad 2)
      {
        sourceGlobalId: 'co:cgp:art:1',
        targetGlobalId: 'co:codigo-civil:art:2341',
        rawCitation: 'artículo 2341 del Código Civil',
        citationType: 'remission',
        isLive: true,
        detectedAt: new Date().toISOString()
      }
    ]
  };
  await fs.writeFile(globalRegistryPath, JSON.stringify(mockGlobalRegistry, null, 2), 'utf8');

  // 4. Ejecutar compilación del Grafo Unificado
  const unifiedService = new UnifiedGraphService();
  const graph = await unifiedService.buildUnifiedGraph();

  console.log('\n--- RESUMEN DEL GRAFO UNIFICADO ---');
  console.log(`- Nodos totales:            ${graph.stats.totalNodes}`);
  console.log(`- Aristas totales:          ${graph.stats.totalEdges}`);
  console.log(`- Aristas inter-normativas: ${graph.stats.crossCorpusEdges}`);

  // 5. Validar Métricas y PageRank
  const metricsRaw = await fs.readFile('dist/corpora/unified-metrics.json', 'utf8');
  const metrics = JSON.parse(metricsRaw);

  console.log('\n--- RANKING DE INFLUENCIA JURÍDICA (PAGERANK) ---');
  metrics.topCentralNodes.forEach((node: any, idx: number) => {
    console.log(`  #${idx + 1} [Score: ${node.authorityScore}] ${node.globalId} (${node.title}) - Citas entrantes: ${node.inDegree}`);
  });

  const topNode = metrics.topCentralNodes[0];
  if (topNode.globalId !== 'co:constitucion:art:86') {
    throw new Error('❌ Falla: El Art. 86 Constitucional debía ser el nodo de mayor autoridad.');
  }

  // 6. Probar Propagación de Impacto Transversal
  console.log('\n--- SIMULACIÓN DE IMPACTO: REFORMA AL ARTÍCULO 86 CONSTITUCIONAL ---');
  const impact = await unifiedService.propagateImpact('co:constitucion:art:86');

  console.log(`- Norma modificada: ${impact.modifiedNode}`);
  console.log(`- Nodos dependientes afectados: ${impact.totalDependents}`);
  console.log('- Desglose por Corpus:', impact.corpusBreakdown);
  console.log('\n- Árbol de Propagación:');
  impact.affectedNodes.forEach(n => {
    console.log(`  ↳ [Nivel ${n.depth}] [${n.corpusSlug.toUpperCase()}] ${n.globalId} - Vía: ${n.via} (${n.relationType})`);
  });

  const affectedCivil = impact.affectedNodes.find(n => n.globalId === 'co:codigo-civil:art:2341');
  const affectedCgp = impact.affectedNodes.find(n => n.globalId === 'co:cgp:art:1');

  if (!affectedCivil || affectedCivil.depth !== 1) {
    throw new Error('❌ Falla: El Código Civil Art. 2341 debía afectarse en nivel 1.');
  }

  if (!affectedCgp || affectedCgp.depth !== 2) {
    throw new Error('❌ Falla: El CGP Art. 1 debía afectarse en cascada en nivel 2.');
  }

  console.log('\n======================================================');
  console.log('✅ VEREDICTO: GRAFO UNIFICADO E IMPACT PROPAGATION 100% OPERATIVO');
  console.log('======================================================');
}

runUnifiedGraphSuite();
