/**
 * Script de Ejecución Inmediata - LexDigitalHD Compiler (O2.1)
 */
'use strict';

const path = require('path');
const ControlledPilotRunner = require('./src/operations/O2/ControlledPilotRunner');
const EvidencePersistenceEngine = require('./src/operations/O1/EvidencePersistenceEngine');

// 1. Cargar el corpus de entrada (ej. el fixture hostil o tu propio JSON)
const corpusPayload = require('./src/operations/O2/fixtures/hostilePilotCorpus.json');

// 2. Inicializar el motor de persistencia atómica (O1.1)
const persistenceEngine = new EvidencePersistenceEngine();

// 3. Instanciar el orquestador de la corrida piloto (O2)
const runner = new ControlledPilotRunner(persistenceEngine);

console.log('🔄 Iniciando compilación y corrida piloto controlada...');

// 4. Ejecutar el pipeline completo con autorización de liberación
const result = runner.runPilot(corpusPayload, { authorizeRelease: true });

console.log('==================================================');
console.log('🏁 ESTADO TERMINAL DE LA COMPILACIÓN:', result.terminalState);
console.log('📌 Veredicto:', result.status);
console.log('🔑 Job Identity:', result.propagation.jobIdentity);
console.log('🆔 Execution ID:', result.propagation.executionId);
console.log('🔐 Input Hash (SHA-256):', result.inputHash);
console.log('📜 Certificado Terminal E26.7:', JSON.stringify(result.productionCorpusCertificate, null, 2));
console.log('==================================================');
console.log('✅ Evidencia persistida atómicamente en la carpeta /evidence/');