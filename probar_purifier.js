const { purgarCSSInDesign } = require('./src/core/utils/cssPurifier');

// CSS crudo de ejemplo (como lo generaría InDesign)
const cssCrudo = `
.parrafo-basico {
  font-size: 1851876449pt;
  font-family: 'undefined', sans-serif;
  color: /* InDesign Color: TITULO Constitucion */;
}

.p02-title-main {
  font-size: 16pt;
  font-family: 'Georgia Pro Cond Semibold', sans-serif;
  color: /* InDesign Color: CapÃ­tulo Constitucion */;
  text-align: center;
}
`;

console.log('=== CSS CRUDO (ENTRADA) ===');
console.log(cssCrudo);

console.log('');
console.log('=== CSS PURIFICADO (SALIDA) ===');
const cssLimpio = purgarCSSInDesign(cssCrudo);
console.log(cssLimpio);