import { SemanticIndex, TocEntry } from './SemanticIndexer';

export class CrossReferenceResolver {
  /**
   * Analiza el texto plano y reemplaza menciones como "artículo 13" o "art. 86" 
   * por hipervínculos basados en el índice semántico (TOC).
   */
  public static resolve(text: string, toc: SemanticIndex): string {
    if (!text) return text;

    // Expresión regular para detectar patrones jurídicos comunes (ej. "artículo 13", "art. 86")
    // Captura la palabra clave y el número o identificador del artículo
    const regex = /\b(art[ií]culo|art\.)\s+(\d+)\b/gi;

    return text.replace(regex, (match, prefix, artNum) => {
      // Buscamos en el TOC si existe una entrada que coincida con este número o slug
      const targetSlug = `art-${artNum}`;
      const foundEntry = toc.entries.find((entry: TocEntry) => entry.href.includes(targetSlug));

      if (foundEntry) {
        // Si existe en el índice interno, generamos un enlace inteligente
        return `<a href="${foundEntry.href}" class="internal-xref" title="Ir a ${foundEntry.title}">${match}</a>`;
      }

      // Si no se encuentra en el índice local, se retorna el texto original sin modificar
      return match;
    });
  }
}
