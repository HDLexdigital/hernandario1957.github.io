export type NormativeType = 'constitution' | 'code' | 'statutory_law' | 'ordinary_law' | 'decree';

export interface CorpusMetadata {
  corpusId: string;
  slug: string;
  title: string;
  shortTitle?: string;
  jurisdiction: string;
  type: NormativeType;
  promulgationDate: string;
  activeRelease?: {
    txId: string;
    publishedAt: string;
    versionTag: string;
    checksum: string;
  } | null;
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface CorpusRegistrySchema {
  version: string;
  defaultCorpusId: string;
  corpora: Record<string, CorpusMetadata>;
}
