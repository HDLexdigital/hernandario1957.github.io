'use strict';

const { execSync } = require('child_process');

console.log('[build:public] Iniciando compilación de producción para LexDigitalHD...');

try {
  execSync('npx astro build', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' }
  });
  console.log('[build:public] Compilación estática completada exitosamente.');
} catch (error) {
  console.error('[build:public] Error durante la compilación estática:', error.message);
  process.exit(1);
}
