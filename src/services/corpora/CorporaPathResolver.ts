import * as path from 'path';

export class CorporaPathResolver {
  private static defaultSlug = 'constitucion';

  public static getCorpusDir(slugOrId: string = this.defaultSlug): string {
    const cleanSlug = slugOrId.replace(/^co-/, '').replace(/-\d{4}$/, '');
    return path.resolve(process.cwd(), `dist/corpora/${cleanSlug}`);
  }

  public static getBuildsDir(corpusSlug: string): string {
    return path.resolve(this.getCorpusDir(corpusSlug), 'builds');
  }

  public static getHistoryPath(corpusSlug: string): string {
    return path.resolve(this.getBuildsDir(corpusSlug), 'history.json');
  }

  public static getReleasesDir(corpusSlug: string): string {
    return path.resolve(this.getCorpusDir(corpusSlug), 'releases');
  }

  public static getIndexesDir(corpusSlug: string): string {
    return path.resolve(this.getCorpusDir(corpusSlug), 'indexes');
  }
}
