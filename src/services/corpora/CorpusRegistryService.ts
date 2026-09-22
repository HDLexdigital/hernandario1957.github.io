import * as fs from 'fs/promises';
import * as path from 'path';
import { CorpusMetadata, CorpusRegistrySchema } from '../../models/Corpus';

export class CorpusRegistryService {
  private readonly registryPath = path.resolve(process.cwd(), 'dist/corpora/registry.json');

  public async getRegistry(): Promise<CorpusRegistrySchema> {
    try {
      const raw = await fs.readFile(this.registryPath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return {
        version: '1.0.0',
        defaultCorpusId: 'co-constitucion-1991',
        corpora: {
          'co-constitucion-1991': {
            corpusId: 'co-constitucion-1991',
            slug: 'constitucion',
            title: 'Constitución Política de Colombia',
            shortTitle: 'CP 1991',
            jurisdiction: 'CO',
            type: 'constitution',
            promulgationDate: '1991-07-04',
            activeRelease: null,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      };
    }
  }

  public async saveRegistry(schema: CorpusRegistrySchema): Promise<void> {
    await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
    await fs.writeFile(this.registryPath, JSON.stringify(schema, null, 2), 'utf8');
  }

  public async registerCorpus(corpus: CorpusMetadata): Promise<void> {
    const registry = await this.getRegistry();
    registry.corpora[corpus.corpusId] = {
      ...corpus,
      updatedAt: new Date().toISOString()
    };
    await this.saveRegistry(registry);
  }

  public async resolveCorpus(identifier: string): Promise<CorpusMetadata | null> {
    const registry = await this.getRegistry();
    return (
      registry.corpora[identifier] ||
      Object.values(registry.corpora).find(c => c.slug === identifier) ||
      null
    );
  }
}
