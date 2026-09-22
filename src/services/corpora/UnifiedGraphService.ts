import * as fs from 'fs/promises';
import * as path from 'path';
import {
  UnifiedGraph,
  UnifiedGraphNode,
  UnifiedGraphEdge,
  UnifiedMetrics,
  TransversalImpactResult
} from '../../models/UnifiedGraph';
import { CorpusRegistryService } from './CorpusRegistryService';
import { CorporaPathResolver } from './CorporaPathResolver';

export class UnifiedGraphService {
  private registryService = new CorpusRegistryService();
  private outputPath = path.resolve(process.cwd(), 'dist/corpora/unified-graph.json');
  private metricsPath = path.resolve(process.cwd(), 'dist/corpora/unified-metrics.json');
  private globalRegistryPath = path.resolve(process.cwd(), 'dist/corpora/global-registry.json');

  public async buildUnifiedGraph(): Promise<UnifiedGraph> {
    console.log('[UNIFIED-GRAPH] Fusionando grafos locales y enlaces inter-normativos...');

    const registry = await this.registryService.getRegistry();
    const corporaList = Object.values(registry.corpora);

    const nodesMap = new Map<string, UnifiedGraphNode>();
    const edges: UnifiedGraphEdge[] = [];

    // 1. Cargar e indexar nodos canónicos por cada corpus
    for (const corpus of corporaList) {
      const versionsPath = CorporaPathResolver.getVersionsPath(corpus.slug);
      let corpusNodes: any[] = [];

      try {
        const raw = await fs.readFile(versionsPath, 'utf8');
        const data = JSON.parse(raw);
        corpusNodes = data.nodes || [];
      } catch {
        corpusNodes = [];
      }

      for (const rawNode of corpusNodes) {
        const localClean = rawNode.nodeId.replace(/^art-/, '');
        const globalId = `co:${corpus.slug}:art:${localClean}`;

        nodesMap.set(globalId, {
          globalId,
          corpusId: corpus.corpusId,
          corpusSlug: corpus.slug,
          localId: rawNode.nodeId,
          title: rawNode.title || `Artículo ${localClean}`,
          nodeType: 'art',
          href: `/${corpus.slug}#${rawNode.nodeId}`,
          inDegree: 0,
          outDegree: 0,
          authorityScore: 0
        });
      }
    }

    // 2. Fusionar aristas de referencias inter-normativas
    try {
      const globalRaw = await fs.readFile(this.globalRegistryPath, 'utf8');
      const globalData = JSON.parse(globalRaw);
      const crossEdges: any[] = globalData.edges || [];

      for (const ce of crossEdges) {
        if (!nodesMap.has(ce.sourceGlobalId)) {
          const parts = ce.sourceGlobalId.split(':');
          nodesMap.set(ce.sourceGlobalId, {
            globalId: ce.sourceGlobalId,
            corpusId: `co-${parts[1]}`,
            corpusSlug: parts[1],
            localId: `art-${parts[3]}`,
            title: `Artículo ${parts[3]}`,
            nodeType: 'art',
            href: `/${parts[1]}#art-${parts[3]}`,
            inDegree: 0,
            outDegree: 0,
            authorityScore: 0
          });
        }

        if (!nodesMap.has(ce.targetGlobalId)) {
          const parts = ce.targetGlobalId.split(':');
          nodesMap.set(ce.targetGlobalId, {
            globalId: ce.targetGlobalId,
            corpusId: `co-${parts[1]}`,
            corpusSlug: parts[1],
            localId: `art-${parts[3]}`,
            title: `Artículo ${parts[3]}`,
            nodeType: 'art',
            href: `/${parts[1]}#art-${parts[3]}`,
            inDegree: 0,
            outDegree: 0,
            authorityScore: 0
          });
        }

        edges.push({
          source: ce.sourceGlobalId,
          target: ce.targetGlobalId,
          relationType: ce.citationType === 'constitutional_basis' ? 'constitutional-basis' : 'cross-corpus-reference',
          rawCitation: ce.rawCitation,
          verified: ce.isLive
        });
      }
    } catch {
      console.warn('[UNIFIED-GRAPH] No se encontró global-registry.json. Omitiendo enlaces externos.');
    }

    // 3. Cálculo de In-Degree y Out-Degree
    for (const edge of edges) {
      const sourceNode = nodesMap.get(edge.source);
      const targetNode = nodesMap.get(edge.target);
      if (sourceNode) sourceNode.outDegree++;
      if (targetNode) targetNode.inDegree++;
    }

    // 4. Algoritmo de PageRank Jurídico (Authority Score)
    this.calculateAuthorityScores(nodesMap, edges);

    const nodes = Array.from(nodesMap.values());
    const crossCorpusEdges = edges.filter(e => {
      const srcSlug = e.source.split(':')[1];
      const tgtSlug = e.target.split(':')[1];
      return srcSlug !== tgtSlug;
    }).length;

    const unifiedGraph: UnifiedGraph = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        crossCorpusEdges,
        internalEdges: edges.length - crossCorpusEdges,
        isolatedNodes: nodes.filter(n => n.inDegree === 0 && n.outDegree === 0).length
      },
      nodes,
      edges
    };

    // 5. Persistir artefactos
    await fs.mkdir(path.dirname(this.outputPath), { recursive: true });
    await fs.writeFile(this.outputPath, JSON.stringify(unifiedGraph, null, 2), 'utf8');

    // 6. Generar y guardar métricas analíticas
    await this.generateMetrics(unifiedGraph);

    return unifiedGraph;
  }

  private calculateAuthorityScores(nodesMap: Map<string, UnifiedGraphNode>, edges: UnifiedGraphEdge[]) {
    const nodes = Array.from(nodesMap.values());
    const N = nodes.length;
    if (N === 0) return;

    const d = 0.85;
    const iterations = 15;
    let scores: Record<string, number> = {};

    nodes.forEach(n => scores[n.globalId] = 1 / N);

    for (let it = 0; it < iterations; it++) {
      const nextScores: Record<string, number> = {};
      nodes.forEach(n => nextScores[n.globalId] = (1 - d) / N);

      for (const edge of edges) {
        const sourceNode = nodesMap.get(edge.source);
        if (sourceNode && sourceNode.outDegree > 0) {
          nextScores[edge.target] += d * (scores[edge.source] / sourceNode.outDegree);
        }
      }
      scores = nextScores;
    }

    const maxScore = Math.max(...Object.values(scores), 0.0001);
    nodes.forEach(n => {
      n.authorityScore = Number(((scores[n.globalId] || 0) / maxScore).toFixed(4));
    });
  }

  private async generateMetrics(graph: UnifiedGraph): Promise<UnifiedMetrics> {
    const sortedByAuthority = [...graph.nodes].sort((a, b) => b.authorityScore - a.authorityScore);
    const topCentralNodes = sortedByAuthority.slice(0, 10).map(n => ({
      globalId: n.globalId,
      title: n.title,
      authorityScore: n.authorityScore,
      inDegree: n.inDegree
    }));

    const crossEdges = graph.edges.filter(e => e.source.split(':')[1] !== e.target.split(':')[1]);
    const bridgeOutCounts: Record<string, number> = {};
    crossEdges.forEach(e => {
      bridgeOutCounts[e.source] = (bridgeOutCounts[e.source] || 0) + 1;
    });

    const bridgeNodes = Object.entries(bridgeOutCounts)
      .map(([globalId, count]) => {
        const node = graph.nodes.find(n => n.globalId === globalId);
        return {
          globalId,
          title: node?.title || globalId,
          crossCorpusOutDegree: count
        };
      })
      .sort((a, b) => b.crossCorpusOutDegree - a.crossCorpusOutDegree)
      .slice(0, 5);

    const corpusConnectivity: Record<string, { inboundReferences: number; outboundReferences: number }> = {};
    for (const edge of crossEdges) {
      const srcSlug = edge.source.split(':')[1];
      const tgtSlug = edge.target.split(':')[1];

      if (!corpusConnectivity[srcSlug]) corpusConnectivity[srcSlug] = { inboundReferences: 0, outboundReferences: 0 };
      if (!corpusConnectivity[tgtSlug]) corpusConnectivity[tgtSlug] = { inboundReferences: 0, outboundReferences: 0 };

      corpusConnectivity[srcSlug].outboundReferences++;
      corpusConnectivity[tgtSlug].inboundReferences++;
    }

    const metrics: UnifiedMetrics = {
      generatedAt: new Date().toISOString(),
      totalNodes: graph.nodes.length,
      topCentralNodes,
      bridgeNodes,
      corpusConnectivity
    };

    await fs.writeFile(this.metricsPath, JSON.stringify(metrics, null, 2), 'utf8');
    return metrics;
  }

  public async propagateImpact(
    modifiedGlobalId: string,
    maxDepth: number = 3
  ): Promise<TransversalImpactResult> {
    const raw = await fs.readFile(this.outputPath, 'utf8');
    const graph: UnifiedGraph = JSON.parse(raw);

    const affectedMap = new Map<string, {
      globalId: string;
      corpusSlug: string;
      title: string;
      depth: number;
      relationType: any;
      via: string;
    }>();

    const queue: { currentId: string; currentDepth: number }[] = [
      { currentId: modifiedGlobalId, currentDepth: 0 }
    ];
    const visited = new Set<string>([modifiedGlobalId]);

    while (queue.length > 0) {
      const { currentId, currentDepth } = queue.shift()!;
      if (currentDepth >= maxDepth) continue;

      const incomingEdges = graph.edges.filter(e => e.target === currentId);

      for (const edge of incomingEdges) {
        if (!visited.has(edge.source)) {
          visited.add(edge.source);
          const sourceNode = graph.nodes.find(n => n.globalId === edge.source);
          const corpusSlug = edge.source.split(':')[1];

          affectedMap.set(edge.source, {
            globalId: edge.source,
            corpusSlug,
            title: sourceNode?.title || edge.source,
            depth: currentDepth + 1,
            relationType: edge.relationType,
            via: currentId
          });

          queue.push({
            currentId: edge.source,
            currentDepth: currentDepth + 1
          });
        }
      }
    }

    const affectedNodes = Array.from(affectedMap.values());
    const corpusBreakdown: Record<string, number> = {};
    affectedNodes.forEach(n => {
      corpusBreakdown[n.corpusSlug] = (corpusBreakdown[n.corpusSlug] || 0) + 1;
    });

    return {
      modifiedNode: modifiedGlobalId,
      evaluatedAt: new Date().toISOString(),
      totalDependents: affectedNodes.length,
      corpusBreakdown,
      affectedNodes
    };
  }
}
