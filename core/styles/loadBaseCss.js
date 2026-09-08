'use strict';

const fs = require('fs');
const path = require('path');

const BASE_CSS_PATH = path.join(__dirname, 'base.css');

function loadBaseCss() {
    if (!fs.existsSync(BASE_CSS_PATH)) {
        throw new Error(`No se encontró base.css en ${BASE_CSS_PATH}`);
    }
    return fs.readFileSync(BASE_CSS_PATH, 'utf8');
}

module.exports = {
    loadBaseCss
};