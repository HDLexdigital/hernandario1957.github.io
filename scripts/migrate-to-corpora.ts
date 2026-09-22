import * as fs from 'fs/promises';
import * as path from 'path';
import { CorpusRegistryService } from '../src/services/corpora/CorpusRegistryService';

async function migrate() {
  console.log('--- INICIANDO MIGRACIÓN ARQUITECTÓNICA A MULTI-CORPUS ---');

  const rootDist = path.resolve(process.cwd(), 'dist');
  const targetDir = path.resolve(rootDist, 'corpora/constitucion');
  await fs.mkdir(targetDir, { recursive: true });

  const foldersToMove = ['builds', 'indexes', 'releases'];

  for (const folder of foldersToMove) {
    const srcPath = path.resolve(rootDist, folder);
    const destPath = path.resolve(targetDir, folder);
    const exists = await fs.stat(srcPath).catch(() => false);
    if (exists) {
      await fs.cp(srcPath, destPath, { recursive: true });
    }
  }

  const registryService = new CorpusRegistryService();
  const registry = await registryService.getRegistry();

  const currentReleasePath = path.resolve(targetDir, 'releases/current.json');
  const currentRaw = await fs.readFile(currentReleasePath, 'utf8').catch(() => null);

  if (currentRaw && registry.corpora['co-constitucion-1991']) {
    const current = JSON.parse(currentRaw);
    registry.corpora['co-constitucion-1991'].activeRelease = {
      txId: current.activeTxId,
      publishedAt: current.publishedAt,
      versionTag: 'v1991-actual',
      checksum: current.checksum || 'sha256-migrated'
    };
  }

  await registryService.saveRegistry(registry);
  console.log('✅ Migración base completada.');
}

migrate();
