import * as fs from 'fs/promises';
import * as path from 'path';
import { CrossCorpusReference, GlobalRegistrySchema, AliasRule } from '../../models/CrossCorpus';
import { CorporaPathResolver } from '../corpora/CorporaPathResolver';

export class CrossCorpusResolver {
  private globalRegistryPath = path.resolve(process.cwd(), 'dist/corpora/global-registry.json');

  // Alias reconocidos en la tradición jurídica colombiana
  private defaultAliases: AliasRule[] = [
    {
      corpusSlug: 'constitucion',
      patterns: [
        'constituci[oó]n(?:\\s+pol[ií]tica)?',
        'constitucional',
        'c\\.?\\s*p\\.?',
        'carta\\s+pol[ií]tica',
        'carta\\s+magna',
        'norma\\s+de\\s+normas',
        'superior'
      ]
    },
    {
      corpusSlug: 'codigo-civil',
      patterns: [
        'c[oó]digo\\s+civil',
        'c\\.?\\s*c\\.?'
      ]
    }
  ];

  public formatGlobalId(jurisdiction: string, corpusSlug: string, nodeType: string, localId: string): string {
    return `${jurisdiction}:${corpusSlug}:${nodeType}:${localId}`;
  }

  public parseGlobalId(globalId: string) {
    const [jurisdiction, corpusSlug, nodeType, localId] = globalId.split(':');
    return { jurisdiction, corpusSlug, nodeType, localId };
  }

  /**
   * Extrae y resuelve citas textuales a otros corpora.
   */
  public async resolveTextCitations(
    sourceGlobalId: string,
    sourceText: string
  ): Promise<CrossCorpusReference[]> {
    const references: CrossCorpusReference[] = [];
    const sourceParts = this.parseGlobalId(sourceGlobalId);

    for (const aliasRule of this.defaultAliases) {
      if (aliasRule.corpusSlug === sourceParts.corpusSlug) continue;

      const aliasGroup = aliasRule.patterns.join('|');
      
      // Patrón flexible con conectores opcionales sin duplicar espacios
      const regex = new RegExp(
        `(?:art[ií]culo|art\\.?)\\s+(\\d+[a-z]?)(?:\\s+(?:(?:de\\s+(?:la|nuestra|este)|del)\\s+)?(${aliasGroup}))`,
        'gi'
      );

      let match;
      while ((match = regex.exec(sourceText)) !== null) {
        const rawCitation = match[0].trim();
        const artNum = match[1].toLowerCase();
        const targetSlug = aliasRule.corpusSlug;
        const targetGlobalId = this.formatGlobalId('co', targetSlug, 'art', artNum);

        const isLive = await this.verifyLiveTarget(targetSlug, artNum);

        references.push({
          sourceGlobalId,
          targetGlobalId,
          rawCitation,
          citationType: targetSlug === 'constitucion' ? 'constitutional_basis' : 'remission',
          isLive,
          targetPath: `/${targetSlug}#art-${artNum}`,
          detectedAt: new Date().toISOString()
        });
      }
    }

    return references;
  }

  private async verifyLiveTarget(targetSlug: string, localArticleId: string): Promise<boolean> {
    const versionsPath = CorporaPathResolver.getVersionsPath(targetSlug);
    try {
      const raw = await fs.readFile(versionsPath, 'utf8');
      const versionsData = JSON.parse(raw);
      const nodes: any[] = versionsData.nodes || [];

      const expectedId = `art-${localArticleId}`;
      return nodes.some(n => n.nodeId === expectedId || n.nodeId === localArticleId);
    } catch {
      return false;
    }
  }

  public async saveReferences(edges: CrossCorpusReference[]): Promise<void> {
    await fs.mkdir(path.dirname(this.globalRegistryPath), { recursive: true });
    
    const registry: GlobalRegistrySchema = {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      aliases: this.defaultAliases,
      edges
    };

    await fs.writeFile(this.globalRegistryPath, JSON.stringify(registry, null, 2), 'utf8');
  }
}
