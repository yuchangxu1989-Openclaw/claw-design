// Domain G: Design System Constraint Layer — Core Types

/** FR-G01: Design System Package structure */
export interface DesignSystemPackage {
  id: string;
  name: string;
  version: string;
  description?: string;

  tokens: DesignTokens;
  components: ComponentClass[];
  reference: ReferencePage;
  constraints: DesignConstraints;
}

export interface DesignTokens {
  colors: Record<string, string>;
  spacing: DesignSpacingScale;
  typography: TypographyScale;
  radius: Record<string, string>;
  shadows: Record<string, string>;
  opacity: Record<string, string>;
}

export interface DesignSpacingScale {
  unit: string;
  values: Record<string, string>;
}

export interface TypographyScale {
  fontFamily: { heading: string; body: string };
  sizes: Record<string, string>;
  weights: Record<string, string>;
  lineHeights: Record<string, string>;
}

export interface ComponentClass {
  name: string;
  selector: string;
  properties: Record<string, string>;
}

/** FR-G03: Reference page for visual baseline */
export interface ReferencePage {
  html: string;
  screenshotPath?: string;
}

/** FR-G04: Constraint rules */
export interface DesignConstraints {
  enforce: ConstraintRule[];
  forbid: ConstraintRule[];
}

export interface ConstraintRule {
  id: string;
  description: string;
  check: (html: string, pkg: DesignSystemPackage) => ConstraintViolation | null;
}

export interface ConstraintViolation {
  ruleId: string;
  message: string;
  location?: string;
  severity: 'block' | 'warn';
}

/** FR-G04: Constraint injection result for LLM prompt */
export interface PromptConstraintBlock {
  enforceRules: string[];
  forbidRules: string[];
  availableTokens: string;
  availableClasses: string[];
}

/** FR-G05: Visual verification result */
export interface VisualVerificationResult {
  passed: boolean;
  /** True when verification was skipped (no provider or no reference). */
  skipped?: boolean;
  deviationPercent: number;
  threshold: number;
  details?: string;
}

/** FR-G04: Generation with retry context */
export interface GenerationAttempt {
  attempt: number;
  maxAttempts: number;
  violations: ConstraintViolation[];
  html: string;
}
