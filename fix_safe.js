const fs = require('fs');
let e9 = fs.readFileSync('./test/regression/e9.regression.test.js', 'utf8');
e9 = e9.replace(/n\.texto=''/g, "n.texto='Texto de relleno'");
fs.writeFileSync('./test/regression/e9.regression.test.js', e9, 'utf8');
let e2e = fs.readFileSync('./test/integration/e2e.pipeline.test.js', 'utf8');
e2e = e2e.replace(/TÃTULO/g, 'TÍTULO').replace(/CAPÃTULO/g, 'CAPÍTULO').replace(/ArtÃ­culo/g, 'Artículo').replace(/ParÃ¡grafo/g, 'Parágrafo').replace(/CÃ³digo/g, 'Código');
fs.writeFileSync('./test/integration/e2e.pipeline.test.js', e2e, 'utf8');

