/**
 * Batería de pruebas unitarias sintéticas (POJOs) para FID01IdentityAssertion.
 * Valida PASS, FAIL, DUPLICATES y NOT_DEMONSTRATED de forma totalmente aislada.
 */

const FID01IdentityAssertion = require('./FID01IdentityAssertion');

function runTests() {
    console.log('====================================================');
    console.log('  🧪 EJECUTANDO SUITE DE PRUEBAS SINTÉTICAS FID-01');
    console.log('====================================================\n');

    let passedTests = 0;
    let failedTests = 0;

    function assert(name, condition, details = '') {
        if (condition) {
            console.log(`  ✅ PASS: ${name}`);
            passedTests++;
        } else {
            console.log(`  ❌ FAIL: ${name} -> ${details}`);
            failedTests++;
        }
    }

    // TEST 1: Correspondencia perfecta (PASS)
    const astDoc1 = {
        nodes: [
            { canonicalId: 'doc.art.1', identityKind: 'IDENTITY.EXPLICIT', nodeKind: 'semantic' },
            { canonicalId: 'doc.art.2', identityKind: 'IDENTITY.EXPLICIT', nodeKind: 'semantic' }
        ]
    };
    const domDoc1 = {
        nodes: [
            { canonicalId: 'doc.art.1', identityKind: 'IDENTITY.EXPLICIT', nodeKind: 'semantic' },
            { canonicalId: 'doc.art.2', identityKind: 'IDENTITY.EXPLICIT', nodeKind: 'semantic' }
        ]
    };
    const res1 = FID01IdentityAssertion.validate(astDoc1, domDoc1);
    assert('Test 1: Correspondencia perfecta entre AST y DOM', res1.status === 'PASS' && res1.metrics.matched === 2);

    // TEST 2: Nodo faltante en DOM (FAIL - MISSING_NODE_MAPPING)
    const astDoc2 = {
        nodes: [
            { canonicalId: 'doc.art.1', identityKind: 'IDENTITY.EXPLICIT', nodeKind: 'semantic' },
            { canonicalId: 'doc.art.2', identityKind: 'IDENTITY.EXPLICIT', nodeKind: 'semantic' }
        ]
    };
    const domDoc2 = {
        nodes: [
            { canonicalId: 'doc.art.1', identityKind: 'IDENTITY.EXPLICIT', nodeKind: 'semantic' }
        ]
    };
    const res2 = FID01IdentityAssertion.validate(astDoc2, domDoc2);
    assert('Test 2: Detección de nodo faltante en DOM', res2.status === 'FAIL' && res2.metrics.missing === 1);

    // TEST 3: Detección de duplicados (FAIL - DUPLICATE_CANONICAL_ID)
    const astDoc3 = {
        nodes: [
            { canonicalId: 'doc.art.1', identityKind: 'IDENTITY.EXPLICIT', nodeKind: 'semantic' },
            { canonicalId: 'doc.art.1', identityKind: 'IDENTITY.EXPLICIT', nodeKind: 'semantic' }
        ]
    };
    const domDoc3 = {
        nodes: [
            { canonicalId: 'doc.art.1', identityKind: 'IDENTITY.EXPLICIT', nodeKind: 'semantic' }
        ]
    };
    const res3 = FID01IdentityAssertion.validate(astDoc3, domDoc3);
    assert('Test 3: Detección estricta de IDs duplicados', res3.status === 'FAIL' && res3.metrics.duplicates === 1);

    // TEST 4: Nodo no demostrable (IDENTITY.UNSTABLE -> NOT_DEMONSTRATED)
    const astDoc4 = {
        nodes: [
            { canonicalId: null, identityKind: 'IDENTITY.UNSTABLE', nodeKind: 'semantic' }
        ]
    };
    const domDoc4 = {
        nodes: [
            { canonicalId: null, identityKind: 'IDENTITY.UNSTABLE', nodeKind: 'semantic' }
        ]
    };
    const res4 = FID01IdentityAssertion.validate(astDoc4, domDoc4);
    assert('Test 4: Manejo de nodos inestables sin error fatal', res4.metrics.unstable === 1 && res4.status === 'NOT_DEMONSTRATED');

    console.log('\n====================================================');
    console.log(`  RESULTADOS: ${passedTests} pasadas, ${failedTests} fallidas.`);
    console.log('====================================================\n');
}

runTests();