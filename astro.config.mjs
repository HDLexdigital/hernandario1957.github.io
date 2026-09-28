import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  srcDir: './src',
  outDir: './dist_web',
  publicDir: './public',
  output: 'server',
  adapter: cloudflare()
});
