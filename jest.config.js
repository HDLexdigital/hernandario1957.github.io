module.exports = {
    testEnvironment: 'node',
    roots: [
        "<rootDir>/core"
    ],
    testMatch: [
        "**/*.test.js",
        "**/*.spec.js"
    ],
    testPathIgnorePatterns: [
        "/node_modules/",
        "/auditoria-exportada/",
        "/MisJSON/",
        "/LexDigital-Pipeline/"
    ]
};