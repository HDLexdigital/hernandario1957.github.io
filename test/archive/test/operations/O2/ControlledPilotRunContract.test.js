/**
 * O2.1 — Controlled Pilot Run Contract Suite (P1–P8 & Failure Paths)
 */

'use strict';

'use strict';

const path = require('path');
const fs = require('fs');

// Rutas absolutas blindadas contra desajustes de profundidad
const ControlledPilotRunner = require(path.join(process.cwd(), 'src', 'operations', 'O2', 'ControlledPilotRunner'));
const hostileCorpus = require(path.join(process.cwd(), 'src', 'operations', 'O2', 'fixtures', 'hostilePilotCorpus.json'));

describe('O2.1 — Controlled Pilot Run Contract Suite', () => {

    const sandboxDir = path.join(process.cwd(), 'test-o2-sandbox');
    let runner;

    beforeEach(() => {
        if (fs.existsSync(sandboxDir)) {
            fs.rmSync(sandboxDir, { recursive: true, force: true });
        }
		const EvidencePersistenceEngine = require(path.join(process.cwd(), 'src', 'operations', 'O1', 'EvidencePersistenceEngine'));
        const persistence = new EvidencePersistenceEngine(sandboxDir);
        runner = new ControlledPilotRunner(persistence);
    });

    afterEach(() => {
        if (fs.existsSync(sandboxDir)) {
            fs.chmodSync(sandboxDir, 0o777);
            fs.rmSync(sandboxDir, { recursive: true, force: true });
        }
    });

    test('P1, P2, P4 & P7. CAMINO VERDE: Ejecuta el piloto hostil y genera certificado terminal válido', () => {
        const result = runner.runPilot(hostileCorpus, { authorizeRelease: true });

        expect(result.status).toBe('SUCCESS');
        expect(result.terminalState).toBe('PRODUCTION');
        expect(result.productionCorpusCertificate.certificationStatus).toBe('CERTIFIED');
        expect(result.inputHash).toBeDefined();
        expect(result.propagation.jobIdentity).toContain('PILOT_HOSTILE_001');
    });

    test('P3 & P6. GESTIÓN DE FALLO: Baseline inválido produce estado QUARANTINED sin certificar', () => {
        const result = runner.runPilot(hostileCorpus, { forceInvalidBaseline: true });

        expect(result.status).toBe('FAILED');
        expect(result.terminalState).toBe('QUARANTINED');
        expect(result.reason).toBe('BASELINE_INTEGRITY_VIOLATION');
    });

    test('P5. EVIDENCIA INCOMPLETA: Falla si la persistencia O1.1 no puede sellar la cadena', () => {
        const result = runner.runPilot(hostileCorpus, { forceIncompleteEvidence: true });
        // Forzando escenario de cuarentena por pérdida de evidencia
        expect(result.terminalState).toBe('QUARANTINED');
    });
});