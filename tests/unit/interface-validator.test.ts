import { describe, it, expect, beforeEach } from 'vitest';
import {
  InterfaceValidator,
  createInterfaceValidator,
} from '../../src/skills/interface-validator.js';
import { createSkillContract } from '../../src/skills/skill-contract.js';
import type { SkillContract } from '../../src/types.js';

const validContract: SkillContract = {
  name: 'test-skill',
  artifactType: 'slides',
  description: 'A test skill',
  triggerKeywords: ['test'],
  version: '1.0.0',
  status: 'active',
};

describe('InterfaceValidator (FR-F02)', () => {
  let validator: InterfaceValidator;

  beforeEach(() => {
    validator = createInterfaceValidator();
  });

  describe('validateContract', () => {
    it('passes for a valid contract', () => {
      const result = validator.validateContract(validContract);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.skillName).toBe('test-skill');
    });

    it('fails for null input', () => {
      const result = validator.validateContract(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('fails for non-object input', () => {
      const result = validator.validateContract('not an object');
      expect(result.valid).toBe(false);
    });

    it('fails for missing name', () => {
      const result = validator.validateContract({ ...validContract, name: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('fails for missing description', () => {
      const result = validator.validateContract({ ...validContract, description: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'description')).toBe(true);
    });

    it('fails for missing artifactType', () => {
      const result = validator.validateContract({ ...validContract, artifactType: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'artifactType')).toBe(true);
    });

    it('fails for unknown artifactType', () => {
      const result = validator.validateContract({ ...validContract, artifactType: 'unknown-type' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'artifactType' && e.message.includes('Unknown'))).toBe(true);
    });

    it('fails for non-array triggerKeywords', () => {
      const result = validator.validateContract({ ...validContract, triggerKeywords: 'not-array' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'triggerKeywords')).toBe(true);
    });

    it('warns for missing version', () => {
      const { version, ...noVersion } = validContract;
      const result = validator.validateContract(noVersion);
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.field === 'version')).toBe(true);
    });

    it('warns for invalid semver version', () => {
      const result = validator.validateContract({ ...validContract, version: 'bad' });
      expect(result.warnings.some(w => w.field === 'version')).toBe(true);
    });

    it('fails for invalid status', () => {
      const result = validator.validateContract({ ...validContract, status: 'invalid' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'status')).toBe(true);
    });

    it('fails for invalid supportedTypes', () => {
      const result = validator.validateContract({ ...validContract, supportedTypes: ['slides', 'bad-type'] });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'supportedTypes')).toBe(true);
    });

    it('fails for non-array supportedTypes', () => {
      const result = validator.validateContract({ ...validContract, supportedTypes: 'not-array' });
      expect(result.valid).toBe(false);
    });

    it('fails for non-array applicableScenes', () => {
      const result = validator.validateContract({ ...validContract, applicableScenes: 'not-array' });
      expect(result.valid).toBe(false);
    });

    it('fails for non-array requiredContext', () => {
      const result = validator.validateContract({ ...validContract, requiredContext: 123 });
      expect(result.valid).toBe(false);
    });

    it('fails for non-array supportedOutputs', () => {
      const result = validator.validateContract({ ...validContract, supportedOutputs: {} });
      expect(result.valid).toBe(false);
    });

    it('fails for invalid inputRange', () => {
      const result = validator.validateContract({ ...validContract, inputRange: 'bad' });
      expect(result.valid).toBe(false);
    });

    it('fails for invalid qualityExpectations', () => {
      const result = validator.validateContract({ ...validContract, qualityExpectations: 'bad' });
      expect(result.valid).toBe(false);
    });

    it('includes checkedAt timestamp', () => {
      const result = validator.validateContract(validContract);
      expect(result.checkedAt).toBeDefined();
      expect(new Date(result.checkedAt).getTime()).not.toBeNaN();
    });

    it('validates contract created by createSkillContract', () => {
      const contract = createSkillContract('slides-skill', 'slides', 'Presentation skill');
      const result = validator.validateContract(contract);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateSkillImplementation', () => {
    const mockSkill = {
      contract: validContract,
      generate: async (_input: string, _theme: unknown, _ctx: unknown) => ({
        taskId: 't1', type: 'slides' as const, status: 'ready' as const,
        html: '<div></div>', pages: 1, metadata: {},
      }),
    };

    it('passes for a valid skill implementation', () => {
      const result = validator.validateSkillImplementation(mockSkill);
      expect(result.valid).toBe(true);
    });

    it('fails for null skill', () => {
      const result = validator.validateSkillImplementation(null);
      expect(result.valid).toBe(false);
    });

    it('fails for missing contract', () => {
      const result = validator.validateSkillImplementation({ generate: () => {} });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'contract')).toBe(true);
    });

    it('fails for missing generate method', () => {
      const result = validator.validateSkillImplementation({ contract: validContract });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'generate')).toBe(true);
    });

    it('warns for generate with too few params', () => {
      const skill = { contract: validContract, generate: (_a: string) => {} };
      const result = validator.validateSkillImplementation(skill);
      expect(result.warnings.some(w => w.field === 'generate')).toBe(true);
    });

    it('validates contract within skill', () => {
      const badSkill = {
        contract: { ...validContract, name: '' },
        generate: async () => ({}),
      };
      const result = validator.validateSkillImplementation(badSkill);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });
  });

  describe('validateCapabilityContract', () => {
    const validCapContract = {
      ...validContract,
      manifestVersion: '1.0',
      capabilitySpec: {
        generates: ['slides'],
        supportsInputs: ['text'],
        outputs: { primary: 'html', secondary: [] },
        qualityCommitments: { structuralIntegrity: true, visualConsistency: true, accessibility: true },
      },
    };

    it('passes for a valid capability contract', () => {
      const result = validator.validateCapabilityContract(validCapContract);
      expect(result.valid).toBe(true);
    });

    it('fails for missing manifestVersion', () => {
      const { manifestVersion, ...noManifest } = validCapContract;
      const result = validator.validateCapabilityContract(noManifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'manifestVersion')).toBe(true);
    });

    it('fails for missing capabilitySpec', () => {
      const { capabilitySpec, ...noCaps } = validCapContract;
      const result = validator.validateCapabilityContract(noCaps);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'capabilitySpec')).toBe(true);
    });

    it('fails for empty generates array', () => {
      const contract = { ...validCapContract, capabilitySpec: { ...validCapContract.capabilitySpec, generates: [] } };
      const result = validator.validateCapabilityContract(contract);
      expect(result.valid).toBe(false);
    });

    it('fails for missing supportsInputs', () => {
      const caps = { ...validCapContract.capabilitySpec };
      delete (caps as Record<string, unknown>).supportsInputs;
      const result = validator.validateCapabilityContract({ ...validCapContract, capabilitySpec: caps });
      expect(result.valid).toBe(false);
    });

    it('fails for missing outputs', () => {
      const caps = { ...validCapContract.capabilitySpec };
      delete (caps as Record<string, unknown>).outputs;
      const result = validator.validateCapabilityContract({ ...validCapContract, capabilitySpec: caps });
      expect(result.valid).toBe(false);
    });

    it('warns for missing qualityCommitments', () => {
      const caps = { ...validCapContract.capabilitySpec };
      delete (caps as Record<string, unknown>).qualityCommitments;
      const result = validator.validateCapabilityContract({ ...validCapContract, capabilitySpec: caps });
      expect(result.warnings.some(w => w.field === 'capabilitySpec.qualityCommitments')).toBe(true);
    });

    it('validates contract from createSkillContract', () => {
      const contract = createSkillContract('test', 'slides', 'Test');
      const result = validator.validateCapabilityContract(contract);
      expect(result.valid).toBe(true);
    });
  });

  describe('strict mode', () => {
    it('warns for missing applicableScenes in strict mode', () => {
      const strictValidator = createInterfaceValidator({ strictMode: true });
      const result = strictValidator.validateContract(validContract);
      expect(result.warnings.some(w => w.field === 'applicableScenes')).toBe(true);
    });

    it('warns for missing supportedOutputs in strict mode', () => {
      const strictValidator = createInterfaceValidator({ strictMode: true });
      const result = strictValidator.validateContract(validContract);
      expect(result.warnings.some(w => w.field === 'supportedOutputs')).toBe(true);
    });

    it('no strict warnings in default mode', () => {
      const result = validator.validateContract(validContract);
      expect(result.warnings.some(w => w.message.startsWith('Strict:'))).toBe(false);
    });
  });
});
