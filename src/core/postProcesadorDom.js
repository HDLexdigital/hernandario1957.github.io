function procesarDOM(htmlBase) {
    if (typeof htmlBase !== 'string') {
        return '';
    }
    return htmlBase.trim();
}

module.exports = { procesarDOM };