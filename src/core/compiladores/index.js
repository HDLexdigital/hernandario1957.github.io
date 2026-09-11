'use strict';

/**
 * Fachada de compiladores LexDigitalHD 2.0
 *
 * API unificada para acceder a todos los compiladores modulares.
 * No reemplaza imports directos: es una frontera conveniente.
 */

const troncales = {
    catalogo: require('./catalogo'),
    timeline: require('./timeline'),
    metricas: require('./metricas'),
    globalTimeline: require('./global-timeline'),
    exports: require('./exports'),
    novedades: require('./novedades'),
    feed: require('./feed'),
    sitemap: require('./sitemap'),
    searchIndex: require('./search-index'),
    web: require('./web'),
    compilarLexmotor: require('./compilarLexmotor')
};

const dashboards = {
    anchors: require('./dashboards/anchors'),
    audit: require('./dashboards/audit'),
    collection: require('./dashboards/collection'),
    deployStatus: require('./dashboards/deploy-status'),
    exports: require('./dashboards/exports'),
    externalLinks: require('./dashboards/external-links'),
    globalTimeline: require('./dashboards/global-timeline'),
    home: require('./dashboards/home'),
    integrity: require('./dashboards/integrity'),
    metrics: require('./dashboards/metrics'),
    nav: require('./dashboards/nav'),
    novedades: require('./dashboards/novedades'),
    search: require('./dashboards/search'),
    searchAdvanced: require('./dashboards/search-advanced'),
    searchRelevance: require('./dashboards/search-relevance')
};

const pdf = {
    full: require('./pdf/full'),
    print: require('./pdf/print'),
    weasyprint: require('./pdf/weasyprint')
};

module.exports = {
    troncales,
    dashboards,
    pdf
};
