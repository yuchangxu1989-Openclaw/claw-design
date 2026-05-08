// FR-D11: Slop Check Execution Pipeline
// Runs after brand constraint checks, before final delivery packaging.
// Returns structured results; caller handles retry logic.

import type { SlopRule, SlopViolation } from './slop-blacklist.js';
import { SlopConfigManager } from './slop-config.js';
import type { SlopBlacklistConfig } from './slop-config.js';

/** Result of a Slop check run */
export interface SlopCheckResult {
  /** true if no block-severity violations found */
  passed: boolean;
  /** All violations found */
  violations: SlopViolation[];
  /** Violations with severity=block (cause passed=false) */
  blockers: SlopViolation[];
  /** Violations with severity=warn (informational, don't block) */
  warnings: SlopViolation[];
  /** Rule IDs that were checked */
  rulesChecked: string[];
  /** Timestamp of the check */
  checkedAt: string;
}

/** Options for the Slop checker */
export interface SlopCheckerOptions {
  /** Slop blacklist configuration */
  config?: SlopBlacklistConfig;
  /** Rule IDs to exempt (e.g., user explicitly declared a style via FR-D05 AC3) */
  exemptRules?: string[];
}

/**
 * Slop Check Execution Pipeline.
 *
 * AC1: Runs after brand constraint checks, before delivery packaging.
 * AC2: Iterates all active rules (built-in + custom, excluding disabled).
 * AC3: Block violations → passed=false (caller triggers retry, max 3).
 * AC4: Warn violations → passed=true, included in quality report.
 * AC5: Multiple blockers returned together for single retry injection.
 * AC8: Exempt rules are downgraded to warn (user-declared style override).
 */
export class SlopChecker {
  private configManager: SlopConfigManager;
  private exemptRules: Set<string>;

  constructor(options?: SlopCheckerOptions) {
    this.configManager = new SlopConfigManager(options?.config);
    this.exemptRules = new Set(options?.exemptRules ?? []);
  }

  /**
   * Run all active Slop rules against the given HTML.
   * AC2: Iterates all active rules.
   * AC5: All blockers collected in one pass.
   */
  check(html: string): SlopCheckResult {
    const activeRules = this.configManager.getActiveRules();
    const violations: SlopViolation[] = [];
    const rulesChecked: string[] = [];

    for (const rule of activeRules) {
      rulesChecked.push(rule.id);
      const ruleViolations = rule.detect(html);

      // AC8: If rule is exempt, downgrade severity to warn
      if (this.exemptRules.has(rule.id)) {
        for (const v of ruleViolations) {
          violations.push({ ...v, severity: 'warn' });
        }
      } else {
        violations.push(...ruleViolations);
      }
    }

    const blockers = violations.filter(v => v.severity === 'block');
    const warnings = violations.filter(v => v.severity === 'warn');

    return {
      passed: blockers.length === 0,
      violations,
      blockers,
      warnings,
      rulesChecked,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Get the config manager for runtime configuration changes.
   */
  getConfigManager(): SlopConfigManager {
    return this.configManager;
  }

  /**
   * AC3/AC5: Generate retry guidance for blocked violations.
   * Returns a structured prompt injection describing what to avoid.
   */
  generateRetryGuidance(blockers: SlopViolation[]): string {
    if (blockers.length === 0) return '';

    const lines = [
      '⚠️ The following AI visual anti-patterns were detected and must be avoided:',
      '',
    ];

    for (const v of blockers) {
      lines.push(`- [${v.ruleId}] ${v.ruleName}: ${v.message}`);
      if (v.location) {
        lines.push(`  Location: ${v.location}`);
      }
    }

    lines.push('');
    lines.push('Please regenerate the design avoiding these patterns. Use unique, intentional design choices instead of generic AI defaults.');

    return lines.join('\n');
  }
}
