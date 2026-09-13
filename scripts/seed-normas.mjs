import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/content/normas';
if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });

const temas = [
{ tipo: 'ley', numero: '27.742', titulo: 'Ley de Bases y Puntos de Partida para la Libertad de los Argentinos', materia: 'administrativo', anio: 2024 },
{ tipo: 'decreto', numero: '70/2023', titulo: 'Decreto de Necesidad y Urgencia sobre Desregulación Económica', materia: 'economico', anio: 2023 },
{ tipo: 'ley', numero: '27.701', titulo: 'Ley de Presupuesto General de la Administración Nacional', materia: 'presupuestario', anio: 2023 },
{ tipo: 'ley', numero: '27.610', titulo: 'Ley de Interrupción Voluntaria del Embarazo', materia: 'salud', anio: 2021 },
{ tipo: 'ley', numero: '27.541', titulo: 'Ley de Solidaridad Social y Reactivación Productiva', materia: 'tributario', anio: 2020 },
{ tipo: 'decreto', numero: '260/2020', titulo: 'Emergencia Sanitaria por COVID-19', materia: 'salud', anio: 2020 },
{ tipo: 'ley', numero: '27.499', titulo: 'Ley de Capacitación Obligatoria en Género', materia: 'laboral', anio: 2019 },
{ tipo: 'ley', numero: '27.275', titulo: 'Ley de Acceso a la Información Pública', materia: 'administrativo', anio: 2016 },
{ tipo: 'ley', numero: '26.994', titulo: 'Código Civil y Comercial de la Nación', materia: 'civil', anio: 2014 },
{ tipo: 'ley', numero: '20.744', titulo: 'Ley de Contrato de Trabajo', materia: 'laboral', anio: 1976 },
];

const aperturas = [
'El presente artículo establece que',
'A los efectos de la presente norma, se entiende por',
'La autoridad de aplicación podrá disponer',
'Quedan alcanzados por las disposiciones del presente',
'Con carácter excepcional, y mediante resolución fundada,',
'Serán aplicables supletoriamente las disposiciones del',
'Las personas físicas o jurídicas alcanzadas deberán',
'El incumplimiento de las obligaciones establecidas en',
'Facúltase a la reglamentación a determinar',
'Las disposiciones de la presente serán de aplicación',
];

const desarrollos = [
'todos los actos jurídicos que se celebren en el territorio nacional con posterioridad a la entrada en vigencia.',
'las condiciones mínimas de cumplimiento exigibles a los sujetos obligados, conforme los estándares internacionales.',
'la suspensión temporaria de los plazos administrativos cuando medien circunstancias de fuerza mayor debidamente acreditadas.',
'los procedimientos administrativos iniciados de oficio o por denuncia de particulares interesados.',
'la revisión de las decisiones adoptadas en el marco del procedimiento establecido en el artículo anterior.',
'los principios generales del derecho administrativo en cuanto resulten compatibles con la naturaleza específica de la materia.',
'dar cumplimiento a las obligaciones de información, registración y control previstas en la presente norma.',
'las obligaciones emergentes de la presente ley dará lugar a la aplicación de las sanciones previstas en el régimen pertinente.',
'los requisitos adicionales que resulten necesarios para la efectiva implementación del sistema.',
'en todo el territorio de la República, sin perjuicio de las competencias locales concurrentes.',
];

const cierres = [
'La reglamentación establecerá las modalidades y plazos de aplicación.',
'Las disposiciones se interpretarán de manera armónica con el resto del ordenamiento jurídico.',
'Las erogaciones que demande su implementación se imputarán a las partidas presupuestarias correspondientes.',
'La autoridad de aplicación dictará las normas complementarias que resulten necesarias.',
'Los sujetos obligados deberán adecuar sus procedimientos internos en un plazo no mayor a noventa (90) días.',
'Las referencias normativas se entenderán efectuadas a las normas vigentes al momento de su aplicación.',
'Serán de aplicación las disposiciones de la Ley Nacional de Procedimientos Administrativos en lo pertinente.',
'El Poder Ejecutivo Nacional procederá a la reglamentación dentro de los ciento ochenta (180) días.',
'Toda controversia será sometida a la jurisdicción de los tribunales federales competentes.',
'Las disposiciones entrarán en vigencia a partir del día siguiente al de su publicación oficial.',
];

function parrafos(titulo, i) {
const out = [];
for (let p = 0; p < 30; p++) {
const a = aperturas[(i + p) % aperturas.length];
const d = desarrollos[(i + p * 3) % desarrollos.length];
const c = cierres[(i * 2 + p) % cierres.length];
out.push(a + ' ' + d + ' ' + c);
}
return out;
}

temas.forEach((t, i) => {
const slug = t.tipo + '-' + t.numero.replace(/[^0-9]/g, '') + '-' + t.materia;
const fecha = new Date(t.anio, (i * 2) % 12, 15).toISOString().split('T')[0];
const cuerpo = parrafos(t.titulo, i);

const lineas = [
'---',
'title: "' + t.titulo + '"',
'tipo: ' + t.tipo,
'numero: "' + t.numero + '"',
'fecha: ' + fecha,
'resumen: "Norma ficticia de demostración sobre materia ' + t.materia + '."',
'materia: ' + t.materia,
'vigente: true',
'---',
'',
'# ' + t.titulo,
'',
];

cuerpo.forEach((p, idx) => {
lineas.push('## Artículo ' + (idx + 1) + '°', '', p, '');
});

const file = join(DIR, slug + '.md');
writeFileSync(file, lineas.join('\n'), 'utf8');
console.log('✔ ' + file);
});

console.log('\nGeneradas ' + temas.length + ' normas ficticias en ' + DIR + '/');
