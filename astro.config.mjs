// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lexdigitalhd.com',
  integrations: [
    // Activamos la integración de Tailwind con su configuración por defecto
    tailwind(),
    // sitemap(), // (Se mantiene comentado hasta que quieras activar el mapa del sitio)
  ],
  output: 'static'
  // Eliminamos la regla de "inlineStylesheets" para que Cloudflare maneje los archivos CSS de forma nativa
});