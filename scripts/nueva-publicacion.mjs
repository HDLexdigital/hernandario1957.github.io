#!/usr/bin/env node

// Script interactivo para crear una publicación nueva
// Uso: npm run nueva-publicacion

import { createInterface } from 'node:readline/promises';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';

const rl = createInterface({ input, output });

const ROOT = process.cwd();
const DIR = join(ROOT, 'src/content/publicaciones');

async function ask(pregunta, defaultValue = '') {
  const suffix = defaultValue ? ' [' + defaultValue + ']' : '';
  const respuesta = await rl.question(pregunta + suffix + ': ');
  return respuesta.trim() || defaultValue;
}

async function askList(pregunta) {
  console.log(pregunta + ' (separados por coma, Enter para vacío)');
  const respuesta = await rl.question('> ');
  if (!respuesta.trim()) return [];
  return respuesta.split(',').map(s => s.trim()).filter(Boolean);
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('\n═══ Nueva publicación ═══\n');

  const titulo = await ask('Título');
  if (!titulo) {
    console.log('❌ El título es obligatorio. Saliendo.');
    rl.close();
    process.exit(1);
  }

  const slug = slugify(await ask('Slug (nombre del archivo, sin .md)', slugify(titulo)));
  const subtitulo = await ask('Subtítulo (opcional)');
  const autores = await askList('Autores');
  const coleccion = await ask('Colección (opcional)');
  const materia = await askList('Materias');
  const tipoAcceso = await ask('Tipo de acceso (gratis/pago/suscripcion)', 'pago');
  const precioCOP = parseInt(await ask('Precio en COP (0 si es gratis)', '0'), 10) || 0;
  const precioUSD = parseInt(await ask('Precio en USD (0 si no aplica)', '0'), 10) || 0;
  const descuento = parseInt(await ask('Descuento % (0 si no aplica)', '0'), 10) || 0;
  const portada = await ask('Ruta de portada', '/portadas/' + slug + '.webp');
  const portadaAlt = await ask('Descripción de portada (alt)', titulo);
  const paginas = parseInt(await ask('Páginas (0 si no aplica)', '0'), 10) || 0;
  const isbn = await ask('ISBN (opcional)');
  const fechaPub = await ask('Fecha de publicación (YYYY-MM-DD)', new Date().toISOString().slice(0, 10));
  const resumenCorto = await ask('Resumen corto (máx 280 caracteres)');
  const destacado = (await ask('¿Destacado? (s/n)', 'n')).toLowerCase().startsWith('s');
  const novedad = (await ask('¿Novedad? (s/n)', 'n')).toLowerCase().startsWith('s');

  rl.close();

  const lineas = [
    '---',
    'sku: "LDH-XXX-' + String(Date.now()).slice(-3) + '"',
    'titulo: "' + titulo + '"',
  ];
  if (subtitulo) lineas.push('subtitulo: "' + subtitulo + '"');
  lineas.push('autores:');
  (autores.length ? autores : ['Anónimo']).forEach(a => lineas.push('  - "' + a + '"'));
  lineas.push('editorial: "LexDigitalHD"');
  if (coleccion) lineas.push('coleccion: "' + coleccion + '"');
  lineas.push('materia:');
  (materia.length ? materia : ['general']).forEach(m => lineas.push('  - "' + m + '"'));
  lineas.push('idioma: "es"', 'publico: "profesional"', 'tags: []');
  lineas.push('tipoAcceso: "' + tipoAcceso + '"');
  lineas.push('precioCOP: ' + precioCOP);
  if (precioUSD > 0) lineas.push('precioUSD: ' + precioUSD);
  lineas.push('monedaBase: "COP"');
  if (descuento > 0) lineas.push('descuentoPorcentaje: ' + descuento);
  lineas.push('iva: "exento"');
  lineas.push('formatos:', '  - "html"', '  - "epub"', '  - "pdf-accesible"', '  - "pdf-fijo"', '  - "pwa"');
  lineas.push('portada: "' + portada + '"');
  lineas.push('portadaAlt: "' + portadaAlt + '"');
  if (paginas > 0) lineas.push('paginas: ' + paginas);
  if (isbn) lineas.push('isbn: "' + isbn + '"');
  lineas.push('fechaPublicacion: ' + fechaPub, 'edicion: 1', 'version: "1.0.0"');
  lineas.push('resumenCorto: "' + (resumenCorto || titulo) + '"');
  lineas.push('resumenLargo: ""');
  lineas.push('palabrasClave: []');
  lineas.push('destacado: ' + destacado, 'novedad: ' + novedad);
  lineas.push('relacionados: []', 'normasCitadas: []', 'jurisprudenciaCitada: []');
  lineas.push('---', '', '# ' + titulo, '', '## Sobre esta obra', '', 'Descripción extendida pendiente.');

  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  const file = join(DIR, slug + '.md');

  if (existsSync(file)) {
    console.log('\n❌ Ya existe un archivo con ese slug: ' + file);
    console.log('   Cambiá el slug o borrá el archivo antes de reintentar.');
    process.exit(1);
  }

  writeFileSync(file, lineas.join('\n') + '\n', 'utf8');
  console.log('\n✅ Publicación creada: ' + file);
  console.log('   Editala en VS Code para ajustar detalles.');
  console.log('   Recargá el catálogo con Ctrl + Shift + R.\n');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  rl.close();
  process.exit(1);
});
