import type { ArtifactType, SkillContract, SkillStatus } from '../types.js';

export interface SkillCapabilityContract extends SkillContract {
  manifestVersion: string;
  /** Structured capability spec (ecosystem portal). Distinct from SkillContract.capabilities (LLM routing strings). */
  capabilitySpec: {
    generates: ArtifactType[];
    supportsInputs: string[];
    outputs: {
      primary: string;
      secondary: string[];
    };
    qualityCommitments: {
      structuralIntegrity: boolean;
      visualConsistency: boolean;
      accessibility: boolean;
    };
  };
  dependencies?: {
    required?: string[];
    optional?: string[];
  };
}

export interface SkillInputSpec {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: unknown;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    allowedValues?: string[];
  };
}

export interface SkillOutputSpec {
  name: string;
  type: string;
  format: string;
  description: string;
}

export interface SkillInterfaceDefinition {
  inputs: SkillInputSpec[];
  outputs: SkillOutputSpec[];
  themeRequirements: string[];
  qualityCoverage: string[];
}

export const STANDARD_INPUTS: SkillInputSpec[] = [
  { name: 'content', type: 'string', required: true, description: 'Main content or description for the artifact' },
  { name: 'title', type: 'string', required: false, description: 'Title of the artifact' },
  { name: 'theme', type: 'string', required: false, description: 'Theme pack ID to apply' },
  { name: 'variant', type: 'string', required: false, description: 'Template variant ID' },
];

export const STANDARD_OUTPUTS: SkillOutputSpec[] = [
  { name: 'artifact', type: 'object', format: 'html', description: 'Primary artifact HTML output' },
  { name: 'metadata', type: 'object', format: 'json', description: 'Artifact metadata including pages, structure' },
];

export function createSkillContract(
  name: string,
  artifactType: ArtifactType,
  description: string,
  options?: {
    supportedTypes?: ArtifactType[];
    scenes?: string[];
    version?: string;
    status?: SkillStatus;
  }
): SkillCapabilityContract {
  return {
    name,
    artifactType,
    supportedTypes: options?.supportedTypes ?? [artifactType],
    description,
    triggerKeywords: [],
    applicableScenes: options?.scenes ?? [],
    version: options?.version ?? '1.0.0',
    status: options?.status ?? 'active',
    manifestVersion: '1.0',
    capabilitySpec: {
      generates: options?.supportedTypes ?? [artifactType],
      supportsInputs: ['text', 'structured'],
      outputs: {
        primary: 'html',
        secondary: ['json-metadata'],
      },
      qualityCommitments: {
        structuralIntegrity: true,
        visualConsistency: true,
        accessibility: true,
      },
    },
  };
}

export function validateSkillContract(contract: SkillCapabilityContract): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!contract.name) errors.push('Contract must have a name');
  if (!contract.artifactType) errors.push('Contract must declare artifact type');
  if (!contract.description) errors.push('Contract must have a description');

  if (!contract.version) warnings.push('Contract should declare a version');
  if (!contract.applicableScenes?.length) warnings.push('Contract should declare applicable scenes');

  if (contract.capabilitySpec) {
    if (!contract.capabilitySpec.generates?.length) {
      errors.push('Contract must declare what it generates');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function getInterfaceDefinition(contract: SkillCapabilityContract): SkillInterfaceDefinition {
  return {
    inputs: STANDARD_INPUTS,
    outputs: STANDARD_OUTPUTS,
    themeRequirements: contract.requiredContext ?? [],
    qualityCoverage: [
      'structure-completeness',
      'content-validity',
      'visual-consistency',
    ],
  };
}
