// FR-G04: Constraint Injection — generates prompt constraints + auto-retry
import type {
  DesignSystemPackage,
  ConstraintViolation,
  PromptConstraintBlock,
  GenerationAttempt,
  VisualVerificationResult,
} from './types.js';
import { HardcodedValueDetector } from './constraint-checker.js';
import { VisualVerifier } from './visual-verifier.js';
import type { VisualVerifierOptions } from './visual-verifier.js';

export class ConstraintInjector {
  private detector = new HardcodedValueDetector();

  buildPromptBlock(pkg: DesignSystemPackage): PromptConstraintBlock {
    const tokenDeclarations = Object.entries(pkg.tokens.colors)
      .map(([name, value]) => `  --${name}: ${value};`)
      .join('\n');

    const spacingDeclarations = Object.entries(pkg.tokens.spacing.values)
      .map(([name, value]) => `  --spacing-${name}: ${value};`)
      .join('\n');

    const typographyDeclarations = Object.entries(pkg.tokens.typography.sizes)
      .map(([name, value]) => `  --font-size-${name}: ${value};`)
      .join('\n');

    const availableTokens = [tokenDeclarations, spacingDeclarations, typographyDeclarations]
      .filter(Boolean)
      .join('\n');

    const availableClasses = pkg.components.map(c => c.selector);

    const enforceRules = [
      `Color palette limited to ${Object.keys(pkg.tokens.colors).length} tokens — use only var(--<token-name>)`,
      `Typography scale: ${Object.keys(pkg.tokens.typography.sizes).length} levels — use only var(--font-size-<level>)`,
      `Spacing from fixed scale: ${Object.keys(pkg.tokens.spacing.values).join(', ')} — use only var(--spacing-<size>)`,
    ];

    const forbidRules = [
      'NEVER define custom color values (hex, rgb, hsl) — all colors must reference CSS variables',
      'NEVER set padding/margin with raw px values — use spacing variables',
      'NEVER introduce fonts not declared in the design system package',
    ];

    return { enforceRules, forbidRules, availableTokens, availableClasses };
  }

  formatForPrompt(block: PromptConstraintBlock): string {
    const lines: string[] = [
      '=== DESIGN SYSTEM CONSTRAINTS (MANDATORY) ===',
      '',
      'ENFORCE:',
      ...block.enforceRules.map(r => `  ✓ ${r}`),
      '',
      'FORBID:',
      ...block.forbidRules.map(r => `  ✗ ${r}`),
      '',
      'AVAILABLE CSS VARIABLES:',
      block.availableTokens,
      '',
      'AVAILABLE COMPONENT CLASSES:',
      ...block.availableClasses.map(c => `  .${c}`),
      '',
      '=== END CONSTRAINTS ===',
    ];
    return lines.join('\n');
  }

  validate(html: string, pkg: DesignSystemPackage): ConstraintViolation[] {
    return this.detector.detect(html, pkg);
  }

  shouldRetry(attempt: GenerationAttempt): boolean {
    return attempt.violations.length > 0 && attempt.attempt < attempt.maxAttempts;
  }

  async generateWithRetry(
    pkg: DesignSystemPackage,
    generator: (constraintPrompt: string, previousViolations?: ConstraintViolation[]) => Promise<string>,
    options?: VisualVerifierOptions,
  ): Promise<{ html: string; attempts: GenerationAttempt[]; visualResult?: VisualVerificationResult }> {
    const verifier = new VisualVerifier(options);
    const promptBlock = this.buildPromptBlock(pkg);
    const constraintPrompt = this.formatForPrompt(promptBlock);
    const attempts: GenerationAttempt[] = [];

    let lastViolations: ConstraintViolation[] | undefined;

    for (let i = 1; i <= MAX_RETRY_ATTEMPTS; i++) {
      const html = await generator(constraintPrompt, lastViolations);

      const staticViolations = this.validate(html, pkg);
      const ruleViolations = this.checkConstraintRules(html, pkg);
      const violations = [...staticViolations, ...ruleViolations];

      const attempt: GenerationAttempt = {
        attempt: i,
        maxAttempts: MAX_RETRY_ATTEMPTS,
        violations,
        html,
      };
      attempts.push(attempt);

      if (violations.length > 0 && i < MAX_RETRY_ATTEMPTS) {
        lastViolations = violations;
        continue;
      }

      if (violations.length > 0) {
        return { html, attempts };
      }

      const visualResult = await verifier.verify(html, pkg);
      if (!visualResult.passed && i < MAX_RETRY_ATTEMPTS) {
        lastViolations = [{
          ruleId: 'visual-deviation',
          message: `Visual deviation ${visualResult.deviationPercent.toFixed(1)}% exceeds ${visualResult.threshold}%`,
          severity: 'block',
        }];
        continue;
      }

      return { html, attempts, visualResult };
    }

    return { html: attempts[attempts.length - 1].html, attempts };
  }

  private checkConstraintRules(html: string, pkg: DesignSystemPackage): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    for (const rule of pkg.constraints.enforce) {
      const v = rule.check(html, pkg);
      if (v) violations.push(v);
    }
    for (const rule of pkg.constraints.forbid) {
      const v = rule.check(html, pkg);
      if (v) violations.push(v);
    }
    return violations;
  }
}

export const MAX_RETRY_ATTEMPTS = 3;
