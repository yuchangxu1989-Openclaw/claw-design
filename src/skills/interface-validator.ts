import type { ArtifactType, DesignSkill, SkillContract, SkillStatus } from '../types.js';
import type { SkillCapabilityContract, SkillInputSpec, SkillOutputSpec } from './skill-contract.js';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  checkedAt: string;
  skillName: string;
}

export interface InterfaceValidatorOptions {
  strictMode?: boolean;
  requiredOutputFormats?: string[];
  requiredCapabilities?: string[];
}

const VALID_ARTIFACT_TYPES: ArtifactType[] = [
  'slides', 'chart', 'arch-diagram', 'flowchart', 'poster',
  'landing-page', 'prototype', 'ui-mockup', 'dashboard',
  'infographic', 'logic-diagram', 'video',
];

const VALID_STATUSES: SkillStatus[] = ['registered', 'active', 'deprecated', 'retired'];

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

export class InterfaceValidator {
  private readonly options: InterfaceValidatorOptions;

  constructor(options: InterfaceValidatorOptions = {}) {
    this.options = options;
  }

  validateContract(contract: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const name = (contract as Record<string, unknown>)?.name as string ?? '<unknown>';

    if (!contract || typeof contract !== 'object') {
      errors.push({ field: 'contract', message: 'Contract must be a non-null object', severity: 'error' });
      return this.buildResult(name, errors, warnings);
    }

    const c = contract as Record<string, unknown>;

    // Required string fields
    if (!c.name || typeof c.name !== 'string') {
      errors.push({ field: 'name', message: 'Contract must have a non-empty string name', severity: 'error' });
    }

    if (!c.description || typeof c.description !== 'string') {
      errors.push({ field: 'description', message: 'Contract must have a non-empty string description', severity: 'error' });
    }

    // artifactType
    if (!c.artifactType || typeof c.artifactType !== 'string') {
      errors.push({ field: 'artifactType', message: 'Contract must declare an artifactType', severity: 'error' });
    } else if (!VALID_ARTIFACT_TYPES.includes(c.artifactType as ArtifactType)) {
      errors.push({ field: 'artifactType', message: `Unknown artifactType: ${c.artifactType}`, severity: 'error' });
    }

    // triggerKeywords
    if (!Array.isArray(c.triggerKeywords)) {
      errors.push({ field: 'triggerKeywords', message: 'triggerKeywords must be an array', severity: 'error' });
    }

    // version
    if (c.version !== undefined) {
      if (typeof c.version !== 'string' || !SEMVER_PATTERN.test(c.version)) {
        warnings.push({ field: 'version', message: 'version should follow semver format (x.y.z)', severity: 'warning' });
      }
    } else {
      warnings.push({ field: 'version', message: 'Contract should declare a version', severity: 'warning' });
    }

    // status
    if (c.status !== undefined && !VALID_STATUSES.includes(c.status as SkillStatus)) {
      errors.push({ field: 'status', message: `Invalid status: ${c.status}. Must be one of: ${VALID_STATUSES.join(', ')}`, severity: 'error' });
    }

    // supportedTypes
    if (c.supportedTypes !== undefined) {
      if (!Array.isArray(c.supportedTypes)) {
        errors.push({ field: 'supportedTypes', message: 'supportedTypes must be an array', severity: 'error' });
      } else {
        for (const t of c.supportedTypes) {
          if (!VALID_ARTIFACT_TYPES.includes(t as ArtifactType)) {
            errors.push({ field: 'supportedTypes', message: `Unknown type in supportedTypes: ${t}`, severity: 'error' });
          }
        }
      }
    }

    // Optional metadata fields
    if (c.applicableScenes !== undefined && !Array.isArray(c.applicableScenes)) {
      errors.push({ field: 'applicableScenes', message: 'applicableScenes must be an array', severity: 'error' });
    }

    if (c.requiredContext !== undefined && !Array.isArray(c.requiredContext)) {
      errors.push({ field: 'requiredContext', message: 'requiredContext must be an array', severity: 'error' });
    }

    if (c.supportedOutputs !== undefined && !Array.isArray(c.supportedOutputs)) {
      errors.push({ field: 'supportedOutputs', message: 'supportedOutputs must be an array', severity: 'error' });
    }

    // inputRange validation
    if (c.inputRange !== undefined) {
      if (typeof c.inputRange !== 'object' || c.inputRange === null) {
        errors.push({ field: 'inputRange', message: 'inputRange must be an object', severity: 'error' });
      }
    }

    // qualityExpectations validation
    if (c.qualityExpectations !== undefined) {
      if (typeof c.qualityExpectations !== 'object' || c.qualityExpectations === null) {
        errors.push({ field: 'qualityExpectations', message: 'qualityExpectations must be an object', severity: 'error' });
      }
    }

    // Strict mode: additional checks
    if (this.options.strictMode) {
      if (!c.applicableScenes || (c.applicableScenes as unknown[]).length === 0) {
        warnings.push({ field: 'applicableScenes', message: 'Strict: contract should declare applicable scenes', severity: 'warning' });
      }
      if (!c.supportedOutputs || (c.supportedOutputs as unknown[]).length === 0) {
        warnings.push({ field: 'supportedOutputs', message: 'Strict: contract should declare supported output formats', severity: 'warning' });
      }
    }

    return this.buildResult(name, errors, warnings);
  }

  validateSkillImplementation(skill: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const name = '<unknown>';

    if (!skill || typeof skill !== 'object') {
      errors.push({ field: 'skill', message: 'Skill must be a non-null object', severity: 'error' });
      return this.buildResult(name, errors, warnings);
    }

    const s = skill as Record<string, unknown>;

    // Must have contract property
    if (!('contract' in s) || !s.contract || typeof s.contract !== 'object') {
      errors.push({ field: 'contract', message: 'Skill must have a contract property', severity: 'error' });
    } else {
      // Validate the contract itself
      const contractResult = this.validateContract(s.contract);
      errors.push(...contractResult.errors);
      warnings.push(...contractResult.warnings);
    }

    // Must have generate method
    if (typeof s.generate !== 'function') {
      errors.push({ field: 'generate', message: 'Skill must implement generate() method', severity: 'error' });
    } else if (s.generate.length < 2) {
      warnings.push({ field: 'generate', message: 'generate() should accept at least 2 parameters (input, theme)', severity: 'warning' });
    }

    const skillName = (s.contract as Record<string, unknown>)?.name as string ?? name;
    return this.buildResult(skillName, errors, warnings);
  }

  validateCapabilityContract(contract: unknown): ValidationResult {
    // First validate as basic contract
    const baseResult = this.validateContract(contract);
    const errors = [...baseResult.errors];
    const warnings = [...baseResult.warnings];

    if (!contract || typeof contract !== 'object') {
      return baseResult;
    }

    const c = contract as Record<string, unknown>;

    // SkillCapabilityContract-specific fields
    if (!c.manifestVersion || typeof c.manifestVersion !== 'string') {
      errors.push({ field: 'manifestVersion', message: 'Capability contract must declare manifestVersion', severity: 'error' });
    }

    if (!c.capabilitySpec || typeof c.capabilitySpec !== 'object') {
      errors.push({ field: 'capabilitySpec', message: 'Capability contract must declare capabilitySpec', severity: 'error' });
    } else {
      const caps = c.capabilitySpec as Record<string, unknown>;

      if (!Array.isArray(caps.generates) || caps.generates.length === 0) {
        errors.push({ field: 'capabilitySpec.generates', message: 'capabilitySpec must declare what it generates', severity: 'error' });
      }

      if (!Array.isArray(caps.supportsInputs)) {
        errors.push({ field: 'capabilitySpec.supportsInputs', message: 'capabilitySpec must declare supported inputs', severity: 'error' });
      }

      if (!caps.outputs || typeof caps.outputs !== 'object') {
        errors.push({ field: 'capabilitySpec.outputs', message: 'capabilitySpec must declare outputs', severity: 'error' });
      }

      if (!caps.qualityCommitments || typeof caps.qualityCommitments !== 'object') {
        warnings.push({ field: 'capabilitySpec.qualityCommitments', message: 'capabilitySpec should declare quality commitments', severity: 'warning' });
      }
    }

    // dependencies
    if (c.dependencies !== undefined) {
      if (typeof c.dependencies !== 'object' || c.dependencies === null) {
        errors.push({ field: 'dependencies', message: 'dependencies must be an object', severity: 'error' });
      }
    }

    const name = (c.name as string) ?? baseResult.skillName;
    return this.buildResult(name, errors, warnings);
  }

  private buildResult(skillName: string, errors: ValidationError[], warnings: ValidationError[]): ValidationResult {
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checkedAt: new Date().toISOString(),
      skillName,
    };
  }
}

export function createInterfaceValidator(options?: InterfaceValidatorOptions): InterfaceValidator {
  return new InterfaceValidator(options);
}
