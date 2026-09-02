'use strict';
const path = require('path');
module.exports = {
    version: '2.0.0',
    rootPath: path.join(__dirname, '..'),
    config: require('./config.json'),
    jsonEditorialAdapter: require('./core/jsonEditorialAdapter'),
    compilarLexmotor: require('../src/index').compilarLexmotor,
    utils: {
        cssPurifier: require('../src/utils/cssPurifier')
    }
};