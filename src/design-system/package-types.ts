// Domain H: Brand Package Ecosystem — Extended Types
import type { DesignSystemPackage } from './types.js';

/** FR-H03: Package metadata for registry listing */
export interface PackageMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  tags: string[];
  colorPreview: string[]; // first 5 hex colors
  valid: boolean;
}

/** FR-H03: Registry search/filter options */
export interface PackageSearchOptions {
  name?: string;
  tag?: string;
  keyword?: string;
}

/** FR-H04: Injection result — dual-layer content for a brand */
export interface BrandInjectionResult {
  promptContext: string;       // design.md content for LLM prompt
  constraints: DesignSystemPackage; // TS constraints for checker
}

/** FR-H07: Package validation result */
export interface PackageValidationResult {
  packageId: string;
  valid: boolean;
  level: 'pass' | 'warn' | 'block';
  errors: PackageValidationError[];
  warnings: PackageValidationError[];
}

export interface PackageValidationError {
  code: string;
  message: string;
  file: 'design.md' | 'index.ts' | 'directory';
}

/** FR-H02: Converter result */
export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  errors: string[];
}

export interface BatchConversionReport {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{ input: string } & ConversionResult>;
}