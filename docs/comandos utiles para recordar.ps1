# Ejecutar tests
npx jest test/core --verbose

# Probar API
node -e "const lex = require('./src'); console.log(lex.version)"

# Verificar estructura
node scripts/verificar-estructura.js

# Iniciar pipeline
node LexDigital-Pipeline/server.js