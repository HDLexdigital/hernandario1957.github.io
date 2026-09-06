'use strict';

const contract = require('../mvp-017-deploy.contract.json');

describe('MVP-017 Deploy Contract', () => {
    test('Define despliegue estático sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.staticDeployment).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Exige HTTPS y dominio configurable', () => {
        expect(contract.principles.httpsRequired).toBe(true);
        expect(contract.principles.domainConfigurable).toBe(true);
        expect(contract.domain.primary).toBeDefined();
    });

    test('Define proveedor, directorio y workflow', () => {
        expect(contract.deployment.provider).toBe('github-pages');
        expect(contract.deployment.artifactDirectory).toBe('public');
        expect(contract.deployment.workflow).toBe('.github/workflows/deploy.yml');
    });

    test('La validación exige directorio, workflow, dominio y HTTPS', () => {
        expect(contract.validation.requireArtifactDirectory).toBe(true);
        expect(contract.validation.requireWorkflow).toBe(true);
        expect(contract.validation.requireDomainConfig).toBe(true);
        expect(contract.validation.requireHttps).toBe(true);
    });
});
