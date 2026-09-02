module.exports = {
    roots: [
        "<rootDir>/src",
        "<rootDir>/test",
        "<rootDir>/core" // 👈 Nueva ruta añadida para LexDigital 2.0
    ],

    testPathIgnorePatterns: [
        "/node_modules/",
        "/auditoria-exportada/",
        "/MisJSON/",
        "/LexDigital-Pipeline/"
    ],

    modulePathIgnorePatterns: [
        "<rootDir>/auditoria-exportada/",
        "<rootDir>/MisJSON/",
        "<rootDir>/LexDigital-Pipeline/"
    ]
};