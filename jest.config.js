module.exports = {
    roots: [
        "<rootDir>/src",
        "<rootDir>/test"
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