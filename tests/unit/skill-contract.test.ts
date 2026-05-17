import { describe, it, expect } from 'vitest';
import {
  createSkillContract,
  validateSkillContract,
  getInterfaceDefinition,
  STANDARD_INPUTS,
  STANDARD_OUTPUTS,
} from '../../src/skills/skill-contract.js';

describe('SkillContract (FR-F01)', () => {
  describe('createSkillContract', () => {
    it('creates a basic contract', () => {
      const contract = createSkillContract('slides-skill', 'slides', 'Presentation skill');
      expect(contract.name).toBe('slides-skill');
      expect(contract.artifactType).toBe('slides');
      expect(contract.description).toBe('Presentation skill');
      expect(contract.version).toBe('1.0.0');
      expect(contract.status).toBe('active');
    });

    it('creates contract with options', () => {
      const contract = createSkillContract('chart-skill', 'chart', 'Chart skill', {
        supportedTypes: ['chart', 'dashboard'],
        scenes: ['data', 'analytics'],
        version: '2.0.0',
      });
      expect(contract.supportedTypes).toContain('chart');
      expect(contract.supportedTypes).toContain('dashboard');
      expect(contract.applicableScenes).toContain('data');
      expect(contract.version).toBe('2.0.0');
    });

    it('defaults to active status', () => {
      const contract = createSkillContract('test-skill', 'slides', 'Test');
      expect(contract.status).toBe('active');
    });
  });

  describe('validateSkillContract', () => {
    it('validates a valid contract', () => {
      const contract = createSkillContract('test-skill', 'slides', 'Test skill');
      const result = validateSkillContract(contract);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('fails for missing name', () => {
      const contract = createSkillContract('', 'slides', 'Test');
      const result = validateSkillContract(contract);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('fails for missing artifact type', () => {
      const contract = createSkillContract('test', '' as any, 'Test');
      const result = validateSkillContract(contract);
      expect(result.valid).toBe(false);
    });

    it('fails for missing description', () => {
      const contract = createSkillContract('test', 'slides', '');
      const result = validateSkillContract(contract);
      expect(result.valid).toBe(false);
    });

    it('warns for optional fields', () => {
      const contract = createSkillContract('test', 'slides', 'Test');
      const result = validateSkillContract(contract);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

describe('SkillInterfaceDefinition (FR-F02)', () => {
  describe('STANDARD_INPUTS', () => {
    it('has required content input', () => {
      const contentInput = STANDARD_INPUTS.find(i => i.name === 'content');
      expect(contentInput).toBeDefined();
      expect(contentInput?.required).toBe(true);
    });

    it('has optional title input', () => {
      const titleInput = STANDARD_INPUTS.find(i => i.name === 'title');
      expect(titleInput).toBeDefined();
      expect(titleInput?.required).toBe(false);
    });
  });

  describe('STANDARD_OUTPUTS', () => {
    it('has artifact output', () => {
      const artifactOutput = STANDARD_OUTPUTS.find(o => o.name === 'artifact');
      expect(artifactOutput).toBeDefined();
      expect(artifactOutput?.format).toBe('html');
    });

    it('has metadata output', () => {
      const metadataOutput = STANDARD_OUTPUTS.find(o => o.name === 'metadata');
      expect(metadataOutput).toBeDefined();
      expect(metadataOutput?.format).toBe('json');
    });
  });

  describe('getInterfaceDefinition', () => {
    it('returns interface definition', () => {
      const contract = createSkillContract('test', 'slides', 'Test');
      const iface = getInterfaceDefinition(contract);
      expect(iface.inputs.length).toBeGreaterThan(0);
      expect(iface.outputs.length).toBeGreaterThan(0);
      expect(iface.themeRequirements).toEqual([]);
    });
  });
});