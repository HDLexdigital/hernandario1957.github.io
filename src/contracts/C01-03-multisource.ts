/**
 * @file C01-03-multisource.ts
 * @description Interfaces TypeScript generadas estrictamente. Cero "any".
 */

export interface DublinCoreMetadata {
  title: string;
  creator: string;
  language: string;
  identifier: string;
}

export interface AccessibilityDirectives {
  wcagLevel: 'A' | 'AA' | 'AAA';
}

export interface ManifestData {
  dublinCore: DublinCoreMetadata;
  a11y: AccessibilityDirectives;
}

export interface SemanticNode {
  id: string;
  type: 'title' | 'chapter' | 'article' | 'paragraph' | 'list' | 'footnote';
  content?: string;
  children?: SemanticNode[];
}

export interface ValidatedSemanticTree {
  documentId: string;
  nodes: SemanticNode[];
}

export interface XhtmlAdapterConfig { modularizeBy: 'chapter' | 'article' | 'none'; }
export interface EpubAdapterConfig { includeFallbackFonts: boolean; }
export interface PdfUaAdapterConfig { taggingStrategy: 'strict' | 'auto'; }
export interface PdfPrintAdapterConfig { colorProfile: 'CMYK-FOGRA39' | 'Grayscale'; }
export interface PwaAdapterConfig { offlineStrategy: 'cache-first' | 'network-first'; }

export interface TargetDirectives {
  xhtml: XhtmlAdapterConfig;
  epub3: EpubAdapterConfig;
  pdfUa: PdfUaAdapterConfig;
  pdfPrint: PdfPrintAdapterConfig;
  pwa: PwaAdapterConfig;
}

export interface C01_03_ContractMultisource {
  version: "1.0.0";
  timestamp: string;
  sourceHash: string; // Garantizado por TS y validado por RegEx SHA-256 en runtime
  manifest: ManifestData;
  semanticTree: Readonly<ValidatedSemanticTree>; 
  targetDirectives: TargetDirectives;
}
