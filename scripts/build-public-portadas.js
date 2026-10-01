'use strict';

/**
 * build-public-portadas.js
 * Sincroniza de forma definitiva todas las portadas canónicas y los artefactos
 * del catálogo web (HTML, JS, CSS, JSON) hacia el directorio 'public/' y 'dist_web/client/'.
 * Esto garantiza que cualquier despliegue (GitHub Pages, Cloudflare Pages, Docker, Nginx)
 * contenga siempre las portadas de todas las publicaciones sin excepción.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');
const DOCS_DIR = path.join(RAIZ, 'docs');
const DIST_CLIENT_DIR = path.join(RAIZ, 'dist_web', 'client');

function copiarRecursivo(origen, destino) {
  if (!fs.existsSync(origen)) return;
  const stat = fs.statSync(origen);
  if (stat.isDirectory()) {
    if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });
    for (const item of fs.readdirSync(origen)) {
      copiarRecursivo(path.join(origen, item), path.join(destino, item));
    }
  } else {
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.copyFileSync(origen, destino);
  }
}

function sincronizar() {
  console.log('\n📚 Sincronizando portadas canónicas y catálogo hacia public/...');

  // 1. Asegurar carpetas destino
  const portadasPublic = path.join(PUBLIC_DIR, 'portadas');
  const portadasImagesPublic = path.join(PUBLIC_DIR, 'images', 'portadas');
  fs.mkdirSync(portadasPublic, { recursive: true });
  fs.mkdirSync(portadasImagesPublic, { recursive: true });

  // 2. Orígenes de portadas
  const fuentesPortadas = [
    path.join(DOCS_DIR, 'images', 'portadas'),
    path.join(DOCS_DIR, 'portadas'),
    path.join(RAIZ, 'images', 'portadas')
  ];

  let totalCopiadas = 0;
  for (const fuente of fuentesPortadas) {
    if (fs.existsSync(fuente)) {
      const archivos = fs.readdirSync(fuente).filter(f => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png'));
      for (const archivo of archivos) {
        const src = path.join(fuente, archivo);
        const dst1 = path.join(portadasPublic, archivo);
        const dst2 = path.join(portadasImagesPublic, archivo);
        fs.copyFileSync(src, dst1);
        fs.copyFileSync(src, dst2);
        totalCopiadas++;
      }
    }
  }
  console.log(`   ✅ ${totalCopiadas} portadas sincronizadas en public/portadas/ y public/images/portadas/`);

  // 3. Sincronizar catálogo clásico hacia public/
  const archivosDocs = [
    'publicaciones.html',
    'ficha-publicacion.html',
    'index.json',
    'contacto.html',
    'suscripcion.html',
    'login.html'
  ];

  for (const archivo of archivosDocs) {
    const src = path.join(DOCS_DIR, archivo);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(PUBLIC_DIR, archivo));
      console.log(`   ✅ Sincronizado ${archivo} -> public/${archivo}`);
    }
  }

  // 4. Sincronizar carpetas de soporte
  const carpetasSoporte = ['js', 'css', 'images', 'plugins', 'styles'];
  for (const carpeta of carpetasSoporte) {
    const srcDir = path.join(DOCS_DIR, carpeta);
    const dstDir = path.join(PUBLIC_DIR, carpeta);
    if (fs.existsSync(srcDir)) {
      copiarRecursivo(srcDir, dstDir);
      console.log(`   ✅ Sincronizada carpeta docs/${carpeta} -> public/${carpeta}`);
    }
  }

  // 5. Si existe dist_web/client (Astro SSR/Cloudflare), sincronizar también allí
  if (fs.existsSync(DIST_CLIENT_DIR)) {
    const distPortadas = path.join(DIST_CLIENT_DIR, 'portadas');
    const distImagesPortadas = path.join(DIST_CLIENT_DIR, 'images', 'portadas');
    copiarRecursivo(portadasPublic, distPortadas);
    copiarRecursivo(portadasImagesPublic, distImagesPortadas);
    console.log(`   ✅ Portadas sincronizadas en dist_web/client/`);
  }

  console.log('🎉 Sincronización de portadas y catálogo finalizada con éxito.');
}

if (require.main === module) {
  try {
    sincronizar();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en sincronización de portadas:', err.message);
    process.exit(1);
  }
}

module.exports = { sincronizar };
