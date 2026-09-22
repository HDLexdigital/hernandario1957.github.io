import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  ApiMetadata,
  CorporaListResponse,
  ResolveNodeResponse,
  CentralityMetricsResponse,
  ImpactResponse
} from '../../models/ApiContract';
import { UnifiedGraph, UnifiedMetrics } from '../../models/UnifiedGraph';
import { UnifiedGraphService } from '../corpora/UnifiedGraphService';
import { CorpusRegistryService } from '../corpora/CorpusRegistryService';

export class StaticApiGeneratorService {
  private baseApiDir = path.resolve(process.cwd(), 'dist/api/v1');
  private unifiedGraphPath = path.resolve(process.cwd(), 'dist/corpora/unified-graph.json');
  private unifiedMetricsPath = path.resolve(process.cwd(), 'dist/corpora/unified-metrics.json');
  private disclaimer = 'Los puntajes de centralidad y simulaciones de propagación de impacto constituyen métricas de análisis topológico de redes y carecen de valor probatorio o fuerza vinculante sobre la vigencia, jerarquía o aplicabilidad de las disposiciones en el ordenamiento jurídico.';

  private async calculateSha256(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Transforma "co:constitucion:art:86" en la ruta física de carpetas "co/constitucion/art/86.json"
   */
  private globalIdToPath(globalId: string, subfolder: 'resolve' | 'impact'): string {
    const parts = globalId.split(':'); // [co, constitucion, art, 86]
    return path.join(this.baseApiDir, subfolder, ...parts) + '.json';
  }

  public async compileAll(): Promise<{ totalEndpointsGenerated: number }> {
    console.log('[API-COMPILER] Iniciando compilación de la API estática v1...');

    const graphRaw = await fs.readFile(this.unifiedGraphPath, 'utf8');
    const graph: UnifiedGraph = JSON.parse(graphRaw);

    const metricsRaw = await fs.readFile(this.unifiedMetricsPath, 'utf8');
    const metrics: UnifiedMetrics = JSON.parse(metricsRaw);

    const graphSha256 = await this.calculateSha256(this.unifiedGraphPath);

    const baseMeta: ApiMetadata = {
      apiVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      sourceGraphSha256: graphSha256,
      computationalDisclaimer: this.disclaimer
    };

    let count = 0;

    // 1. Endpoint /corpora.json
    const registryService = new CorpusRegistryService();
    const registry = await registryService.getRegistry();
    const corporaResponse: CorporaListResponse = {
      meta: {
        apiVersion: '1.0.0',
        generatedAt: baseMeta.generatedAt,
        sourceGraphSha256: graphSha256
      },
      corpora: Object.values(registry.corpora).map(c => ({
        corpusId: c.corpusId,
        slug: c.slug,
        title: c.title,
        shortTitle: c.shortTitle,
        jurisdiction: c.jurisdiction,
        type: c.type,
        promulgationDate: c.promulgationDate,
        status: c.status,
        endpoints: {
          canonicalUrl: `/${c.slug}`,
          graphNodesCount: graph.nodes.filter(n => n.corpusSlug === c.slug).length
        }
      }))
    };

    const corporaPath = path.join(this.baseApiDir, 'corpora.json');
    await fs.mkdir(path.dirname(corporaPath), { recursive: true });
    await fs.writeFile(corporaPath, JSON.stringify(corporaResponse, null, 2), 'utf8');
    count++;

    // 2. Endpoint /metrics/centrality.json
    const centralityResponse: CentralityMetricsResponse = {
      meta: baseMeta,
      totalNodesEvaluated: metrics.totalNodes,
      topCentralNodes: metrics.topCentralNodes.map((n, i) => ({
        rank: i + 1,
        globalId: n.globalId,
        title: n.title,
        authorityScore: n.authorityScore,
        inDegree: n.inDegree
      })),
      bridgeNodes: metrics.bridgeNodes
    };

    const centralityPath = path.join(this.baseApiDir, 'metrics', 'centrality.json');
    await fs.mkdir(path.dirname(centralityPath), { recursive: true });
    await fs.writeFile(centralityPath, JSON.stringify(centralityResponse, null, 2), 'utf8');
    count++;

    // 3. Endpoints por nodo: /resolve/{globalId}.json e /impact/{globalId}.json
    const graphService = new UnifiedGraphService();

    for (const node of graph.nodes) {
      // 3.1 Resolve
      const outbound = graph.edges
        .filter(e => e.source === node.globalId)
        .map(e => ({ targetGlobalId: e.target, relationType: e.relationType, rawCitation: e.rawCitation }));

      const inbound = graph.edges
        .filter(e => e.target === node.globalId)
        .map(e => ({ sourceGlobalId: e.source, relationType: e.relationType }));

      const resolveResponse: ResolveNodeResponse = {
        meta: {
          apiVersion: '1.0.0',
          generatedAt: baseMeta.generatedAt,
          sourceGraphSha256: graphSha256
        },
        node: {
          globalId: node.globalId,
          corpusSlug: node.corpusSlug,
          localId: node.localId,
          title: node.title,
          nodeType: node.nodeType,
          webHref: node.href,
          inDegree: node.inDegree,
          outDegree: node.outDegree,
          authorityScore: node.authorityScore
        },
        references: {
          outbound,
          inbound
        }
      };

      const nodeResolvePath = this.globalIdToPath(node.globalId, 'resolve');
      await fs.mkdir(path.dirname(nodeResolvePath), { recursive: true });
      await fs.writeFile(nodeResolvePath, JSON.stringify(resolveResponse, null, 2), 'utf8');
      count++;

      // 3.2 Impact Simulation
      const impactRaw = await graphService.propagateImpact(node.globalId, 3);
      const impactResponse: ImpactResponse = {
        meta: baseMeta,
        simulation: {
          evaluatedGlobalId: impactRaw.modifiedNode,
          depthLimit: 3,
          totalDependentsAffected: impactRaw.totalDependents,
          corpusDistribution: impactRaw.corpusBreakdown,
          affectedTree: impactRaw.affectedNodes.map(an => ({
            globalId: an.globalId,
            corpusSlug: an.corpusSlug,
            title: an.title,
            cascadeDepth: an.depth,
            relationType: an.relationType,
            viaGlobalId: an.via
          }))
        }
      };

      const nodeImpactPath = this.globalIdToPath(node.globalId, 'impact');
      await fs.mkdir(path.dirname(nodeImpactPath), { recursive: true });
      await fs.writeFile(nodeImpactPath, JSON.stringify(impactResponse, null, 2), 'utf8');
      count++;
    }

    console.log(`[API-COMPILER] Éxito: ${count} endpoints JSON inmutables generados.`);
    return { totalEndpointsGenerated: count };
  }
}
