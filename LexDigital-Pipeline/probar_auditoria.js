const { auditarCSS, imprimirReporteAuditoria } = require('./core/auditarCSS');
const css = '.p01_body_base { font-size: 14pt; color: "Test"; }';
const xhtml = '<p class="p01_body_base">Test</p>';
const resultado = auditarCSS(css, xhtml);
imprimirReporteAuditoria(resultado);