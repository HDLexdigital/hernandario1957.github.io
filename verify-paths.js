const fs = require('fs');
const path = require('path');

console.log('--- AUDITORÍA DE RUTAS (CRÍTICO-01) ---');
console.log(`Directorio de ejecución (pwd): ${process.cwd()}`);

const validatorExpectedPath = path.join(process.cwd(), 'src/validadores/C01-03-multisource.validator.ts');
const validatorExists = fs.existsSync(validatorExpectedPath);
console.log(`\n1. Ubicación del Validador:`);
console.log(`   Ruta esperada: ${validatorExpectedPath}`);
console.log(`   ¿Existe?: ${validatorExists ? 'SÍ' : 'NO'}`);

if (validatorExists) {
    const validatorDir = path.dirname(validatorExpectedPath);
    // Simular el __dirname dentro del validador
    const schemaResolvedPath = path.resolve(validatorDir, '../../schemas/C01-03-multisource.schema.json');
    const schemaExists = fs.existsSync(schemaResolvedPath);
    
    console.log(`\n2. Resolución efectiva de la ruta del Schema:`);
    console.log(`   Directorio base (__dirname simulado): ${validatorDir}`);
    console.log(`   Ruta calculada a leer (../../schemas/...): ${schemaResolvedPath}`);
    console.log(`   ¿El Schema existe en esa ruta calculada?: ${schemaExists ? 'SÍ' : 'NO'}`);
}
