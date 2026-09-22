export type GlobalJurisdiction = 'co';
export type GlobalNodeType = 'art' | 'cap' | 'tit' | 'num' | 'par';

export interface GlobalIdParts {
  jurisdiction: GlobalJurisdiction;
  corpusSlug: string;
  nodeType: GlobalNodeType;
  localId: string;
}

export interface AliasRule {
  corpusSlug: string;
  patterns: string[]; // Expresiones regulares serializadas para reconocer el corpus
}

export interface CrossCorpusReference {
  sourceGlobalId: string;       // Ej: "co:codigo-civil:art:2341"
  targetGlobalId: string;       // Ej: "co:constitucion:art:86"
  rawCitation: string;          // Texto exacto extraído: "artículo 86 de la Constitución"
  citationType: 'constitutional_basis' | 'remission' | 'hierarchy';
  isLive: boolean;              // true si el nodo existe y está vigente en el target
  targetPath: string;           // URL web: "/constitucion#art-86"
  detectedAt: string;
}

export interface GlobalRegistrySchema {
  version: string;
  updatedAt: string;
  aliases: AliasRule[];
  edges: CrossCorpusReference[];
}
