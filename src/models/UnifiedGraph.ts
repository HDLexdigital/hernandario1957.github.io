export type UnifiedRelationType =
  | 'internal-reference'      // Cita interna dentro del mismo código
  | 'constitutional-basis'    // Fundamento constitucional (ej: tutela, debido proceso)
  | 'procedural-reference'    // Remisión a norma adjetiva/procesal
  | 'cross-corpus-reference'  // Remisión sustantiva entre códigos
  | 'hierarchy';              // Relación estructural (Título -> Capítulo -> Artículo)

export interface UnifiedGraphNode {
  globalId: string;           // Ej: "co:constitucion:art:86"
  corpusId: string;           // Ej: "co-constitucion-1991"
  corpusSlug: string;         // Ej: "constitucion"
  localId: string;            // Ej: "art-86"
  title: string;              // Ej: "Artículo 86. Acción de tutela"
  nodeType: 'art' | 'cap' | 'tit' | 'num' | 'par';
  href: string;               // Enlace canónico web: "/constitucion#art-86"
  inDegree: number;           // Cantidad de normas que citan este nodo
  outDegree: number;          // Cantidad de normas citadas por este nodo
  authorityScore: number;     // PageRank Jurídico normalizado (0.0 a 1.0)
}

export interface UnifiedGraphEdge {
  source: string;             // globalId de origen (el que cita)
  target: string;             // globalId de destino (la norma citada)
  relationType: UnifiedRelationType;
  rawCitation?: string;
  verified: boolean;          // true si la cita viva fue auditada
}

export interface UnifiedGraph {
  version: '1.0.0';
  generatedAt: string;
  stats: {
    totalNodes: number;
    totalEdges: number;
    crossCorpusEdges: number;
    internalEdges: number;
    isolatedNodes: number;
  };
  nodes: UnifiedGraphNode[];
  edges: UnifiedGraphEdge[];
}

export interface TransversalImpactPath {
  depth: number;
  sourceGlobalId: string;
  targetGlobalId: string;
  relationType: UnifiedRelationType;
  corpusSlug: string;
}

export interface TransversalImpactResult {
  modifiedNode: string;
  evaluatedAt: string;
  totalDependents: number;
  corpusBreakdown: Record<string, number>;
  affectedNodes: {
    globalId: string;
    corpusSlug: string;
    title: string;
    depth: number;
    relationType: UnifiedRelationType;
    via: string;
  }[];
}

export interface UnifiedMetrics {
  generatedAt: string;
  totalNodes: number;
  topCentralNodes: {
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
  corpusConnectivity: Record<string, {
    inboundReferences: number;
    outboundReferences: number;
  }>;
}
