import { createHash } from 'crypto';
import { C01_03_ContractMultisource, SemanticNode, DublinCoreMetadata } from '../../contracts/C01-03-multisource';

export class InDesignInputAdapter {
  /**
   * Mapeo de estilos de InDesign a Tipos Semánticos del Motor.
   */
  private mapStyleToSemanticType(indesignStyle: string): 'title' | 'chapter' | 'article' | 'paragraph' {
    const style = (indesignStyle || '').toUpperCase();
    if (style.includes('TITULO') || style.includes('TITLE')) return 'title';
    if (style.includes('CAPITULO') || style.includes('CHAPTER')) return 'chapter';
    if (style.includes('ARTICULO') || style.includes('ARTICLE')) return 'article';
    return 'paragraph'; // Fallback por defecto
  }

  public transform(rawJson: any): C01_03_ContractMultisource {
    const doc = rawJson.document || {};
    const meta = doc.metadata || {};
    
    // 1. Traducir Metadatos a Dublin Core
    const dublinCore: DublinCoreMetadata = {
      title: meta.title || doc.name || 'Documento sin título',
      creator: meta.author || 'Autor Desconocido',
      language: "es-CO",
      identifier: `urn:uuid:${doc.uuid || '0000'}`
    };

    // 2. Extraer y Limpiar Nodos Semánticos
    const nodes: SemanticNode[] = [];
    const stories = rawJson.body || [];

    for (const story of stories) {
      if (story.type !== 'story') continue;
      
      for (const p of story.children || []) {
        if (p.type !== 'paragraph') continue;
        
        // Aplanar los spans de texto y purgar caracteres invisibles crudos (\r)
        const rawText = (p.children || [])
          .filter((c: any) => c.type === 'text' && c.text)
          .map((c: any) => c.text)
          .join('')
          .replace(/\r/g, '')
          .trim();

        if (!rawText) continue; // Ignorar párrafos vacíos

        nodes.push({
          id: p.nodeId,
          type: this.mapStyleToSemanticType(p.style),
          content: rawText
        });
      }
    }

    const semanticTree = {
      documentId: doc.name ? doc.name.replace('.indd', '') : 'doc',
      nodes
    };

    // 3. Firmar el contenido extraído (Hash SHA-256 de 64 caracteres)
    const hash = createHash('sha256').update(JSON.stringify(semanticTree)).digest('hex');

    // 4. Devolver el Contrato Estricto C01-03
    return {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      sourceHash: hash,
      manifest: { dublinCore, a11y: { wcagLevel: "AA" } },
      semanticTree,
      targetDirectives: {
        xhtml: { modularizeBy: "chapter" },
        epub3: { includeFallbackFonts: true },
        pdfUa: { taggingStrategy: "strict" },
        pdfPrint: { colorProfile: "CMYK-FOGRA39" },
        pwa: { offlineStrategy: "cache-first" }
      }
    };
  }
}
