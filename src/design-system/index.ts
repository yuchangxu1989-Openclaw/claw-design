// Domain G: Design System Constraint Layer — Public API
export type {
  DesignSystemPackage,
  DesignTokens,
  DesignSpacingScale,
  TypographyScale,
  ComponentClass,
  ReferencePage,
  DesignConstraints,
  ConstraintRule,
  ConstraintViolation,
  PromptConstraintBlock,
  VisualVerificationResult,
  GenerationAttempt,
} from './types.js';

// Domain H: Brand Package Ecosystem — Types
export type {
  PackageMetadata,
  PackageSearchOptions,
  BrandInjectionResult,
  PackageValidationResult,
  PackageValidationError,
  ConversionResult,
  BatchConversionReport,
} from './package-types.js';

export { DesignSystemRegistry } from './registry.js';
export { HardcodedValueDetector } from './constraint-checker.js';
export { ConstraintInjector, MAX_RETRY_ATTEMPTS } from './constraint-injector.js';
export { VisualVerifier } from './visual-verifier.js';
export type { ScreenshotProvider, ImageComparator, VisualVerifierOptions } from './visual-verifier.js';
export { DARK_SCI_FI_PACKAGE } from './packages/index.js';
export { PackageSchemaValidator } from './schema-validator.js';
export type { ValidationError as SchemaValidationError, SchemaValidationResult } from './schema-validator.js';
export { CssGenerator } from './css-generator.js';
export { SeparationEnforcer } from './separation-enforcer.js';
export { ReferencePageMatcher } from './reference-matcher.js';
export type { TaskType, ReferencePageEntry } from './reference-matcher.js';

// Domain H: Brand Package Ecosystem — Modules
export { BrandPackageRegistry } from './brand-registry.js';
export { BrandInjector } from './injector.js';
export { PackageValidator } from './package-validator.js';
export { ActivePackageManager } from './active-package.js';
