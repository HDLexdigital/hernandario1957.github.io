export interface ApiMetadata {
  apiVersion: '1.0.0';
  generatedAt: string;
  sourceGraphSha256: string;
  computationalDisclaimer?: string;
}

export interface CorporaListResponse {
  meta: ApiMetadata;
  corpora: {
    corpusId: string;
    slug: string;
    title: string;
    shortTitle: string;
    jurisdiction: string;
    type: string;
    promulgationDate: string;
    status: string;
    endpoints: {
      canonicalUrl: string;
      graphNodesCount?: number;
    };
  }[];
}

export interface ResolveNodeResponse {
  meta: ApiMetadata;
  node: {
    globalId: string;
    corpusSlug: string;
    localId: string;
    title: string;
    nodeType: string;
    webHref: string;
    inDegree: number;
    outDegree: number;
    authorityScore: number;
  };
  references: {
    outbound: { targetGlobalId: string; relationType: string; rawCitation?: string }[];
    inbound: { sourceGlobalId: string; relationType: string }[];
  };
}

export interface CentralityMetricsResponse {
  meta: ApiMetadata;
  totalNodesEvaluated: number;
  topCentralNodes: {
    rank: number;
    globalId: string;
    title: string;
    authorityScore: number;
    inDegree: number;
  }[];
  bridgeNodes: {
    globalId: string;
    title: string;
    crossCorpusOutDegree: number;
  }[];
}

export interface ImpactResponse {
  meta: ApiMetadata;
  simulation: {
    evaluatedGlobalId: string;
    depthLimit: number;
    totalDependentsAffected: number;
    corpusDistribution: Record<string, number>;
    affectedTree: {
      globalId: string;
      corpusSlug: string;
      title: string;
      cascadeDepth: number;
      relationType: string;
      viaGlobalId: string;
    }[];
  };
}
