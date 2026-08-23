/**
 * @fileoverview scripts/diagnosticos/test-golden-epub.js
 *
 * E15.3-A — Golden Test de Integración End-to-End (Fixture 211 párrafos).
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const AdmZip = require('adm-zip');

// Importar el orquestador E15.1
const { compilarEPUB } = require('../src/empaquetador/EpubCompiler');

// TODO: Importar aquí los adaptadores del Core / Compilación editorial real
// const { adaptarInDesign } = require('../src/adapters/InDesignAdapter'); // (Ejemplo)
// const { compilarLexmotor } = require('../src/core/LexmotorCompiler');   // (Ejemplo)