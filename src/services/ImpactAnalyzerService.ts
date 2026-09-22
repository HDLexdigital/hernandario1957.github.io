import * as fs from 'fs/promises';
import * as path from 'path';
import { VersionsIndex } from './VersioningService';

export interface ArticleImpactMetric {
  nodeId: string;
  title: string;
  totalReforms: number;
  lastReformDate: string;
  mutationIndexScore: number;
}

export interface ImpactReport {
  generatedAt: string;
  totalAnalyzedNodes: number;
  mostMutatedArticles: ArticleImpactMetric[];
  globalStabilityIndex: number;
}

export class ImpactAnalyzerService {
  private readonly versionsPath: string;
  private readonly metricsPath: string;

  constructor() {
    this.versionsPath = path.resolve(process.cwd(), 'dist/indexes/versions.json');
    this.metricsPath = path.resolve(process.cwd(), 'dist/indexes/impact-metrics.json');
  }

  /**
   * Analiza el historial de versiones y calcula métricas de impacto y mutación.
   */
  public async analyzeAndPersist(): Promise<ImpactReport> {
    let index: VersionsIndex;
    
    try {
      const raw = await fs.readFile(this.versionsPath, 'utf8');
      index = JSON.parse(raw);
    } catch (error) {
      throw new Error("[IMPACT-ANALYZER] No se encontró el artefacto versions.json. Ejecute MVP-066 primero.");
    }

    const metrics: ArticleImpactMetric[] = [];

    for (const node of index.nodes) {
      const totalReforms = Math.max(0, node.versions.length - 1);
      const sortedVersions = [...node.versions].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
      const lastReformDate = sortedVersions[0]?.effectiveDate || '1991-07-04';
      
      // El puntaje de mutación pondera el volumen de versiones históricas
      const mutationIndexScore = totalReforms * 10;

      metrics.push({
        nodeId: node.nodeId,
        title: node.title,
        totalReforms,
        lastReformDate,
        mutationIndexScore
      });
    }

    // Ordenar de mayor a menor mutación (Artículos más reformados primero)
    metrics.sort((a, b) => b.mutationIndexScore - a.mutationIndexScore);

    const report: ImpactReport = {
      generatedAt: new Date().toISOString(),
      totalAnalyzedNodes: metrics.length,
      mostMutatedArticles: metrics,
      globalStabilityIndex: metrics.reduce((acc, m) => acc + m.totalReforms, 0)
    };

    await fs.mkdir(path.dirname(this.metricsPath), { recursive: true });
    await fs.writeFile(this.metricsPath, JSON.stringify(report, null, 2), 'utf8');

    console.log(`[IMPACT-ANALYZER] Reporte de impacto generado en ${this.metricsPath}`);
    return report;
  }
}
