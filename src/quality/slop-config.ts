// FR-D10: Slop Blacklist Configuration & Management
// Supports: add custom rules, disable built-in rules, adjust severity, list active rules.
// Configuration is passed via API (no filesystem dependency).

import type { SlopRule, SlopSeverity, SlopViolation } from './slop-blacklist.js';
import { BUILTIN_SLOP_RULES } from './slop-blacklist.js';

/** User-provided Slop rule (same shape as SlopRule but detect is optional for data-only config) */
export interface SlopRuleInput {
  id: string;
  name: string;
  description: string;
  detection: string;
  severity: SlopSeverity;
  /** Custom detect function; if omitted, a no-op detector is used */
  detect?: (html: string) => SlopViolation[];
}

/** Configuration for the Slop blacklist */
export interface SlopBlacklistConfig {
  /** Rule IDs to disable (built-in rules only) */
  disabledRules?: string[];
  /** Severity overrides: ruleId → new severity */
  severityOverrides?: Record<string, SlopSeverity>;
  /** Custom rules to add */
  customRules?: SlopRuleInput[];
}

/** Rule status for listing */
export interface SlopRuleStatus {
  id: string;
  name: string;
  description: string;
  detection: string;
  severity: SlopSeverity;
  enabled: boolean;
  source: 'builtin' | 'custom';
}

/**
 * Manages the Slop blacklist configuration.
 * AC5: Configuration changes take effect immediately (no restart needed).
 */
export class SlopConfigManager {
  private disabledIds: Set<string>;
  private severityOverrides: Map<string, SlopSeverity>;
  private customRules: SlopRule[];
  private builtinRuleIds: Set<string>;

  constructor(config?: SlopBlacklistConfig) {
    this.builtinRuleIds = new Set(BUILTIN_SLOP_RULES.map(r => r.id));
    this.disabledIds = new Set(config?.disabledRules ?? []);
    this.severityOverrides = new Map(Object.entries(config?.severityOverrides ?? {}));
    this.customRules = [];

    if (config?.customRules) {
      for (const rule of config.customRules) {
        // AC7: Reject custom rules with conflicting IDs
        if (!this.builtinRuleIds.has(rule.id)) {
          this.customRules.push(this.toSlopRule(rule));
        }
      }
    }
  }

  /**
   * AC1: Add a custom Slop rule.
   * AC7: Rejects if id conflicts with a built-in rule.
   * Returns true if added, false if rejected due to conflict.
   */
  addCustomRule(rule: SlopRuleInput): { success: boolean; error?: string } {
    if (this.builtinRuleIds.has(rule.id)) {
      return { success: false, error: `Rule id "${rule.id}" conflicts with a built-in rule` };
    }
    // Also check existing custom rules
    if (this.customRules.some(r => r.id === rule.id)) {
      return { success: false, error: `Custom rule with id "${rule.id}" already exists` };
    }
    this.customRules.push(this.toSlopRule(rule));
    return { success: true };
  }

  /**
   * AC2: Disable a built-in rule by id.
   */
  disableRule(ruleId: string): { success: boolean; error?: string } {
    if (!this.builtinRuleIds.has(ruleId) && !this.customRules.some(r => r.id === ruleId)) {
      return { success: false, error: `Rule "${ruleId}" not found` };
    }
    this.disabledIds.add(ruleId);
    return { success: true };
  }

  /**
   * Re-enable a previously disabled rule.
   */
  enableRule(ruleId: string): { success: boolean; error?: string } {
    if (!this.disabledIds.has(ruleId)) {
      return { success: false, error: `Rule "${ruleId}" is not disabled` };
    }
    this.disabledIds.delete(ruleId);
    return { success: true };
  }

  /**
   * AC3: Adjust severity of a rule (block ↔ warn).
   */
  setSeverity(ruleId: string, severity: SlopSeverity): { success: boolean; error?: string } {
    const exists = this.builtinRuleIds.has(ruleId) || this.customRules.some(r => r.id === ruleId);
    if (!exists) {
      return { success: false, error: `Rule "${ruleId}" not found` };
    }
    this.severityOverrides.set(ruleId, severity);
    return { success: true };
  }

  /**
   * Get all currently active rules (enabled, with severity overrides applied).
   * AC4: Custom rules have the same execution priority as built-in rules.
   */
  getActiveRules(): SlopRule[] {
    const rules: SlopRule[] = [];

    // Built-in rules (excluding disabled)
    for (const rule of BUILTIN_SLOP_RULES) {
      if (this.disabledIds.has(rule.id)) continue;
      const severity = this.severityOverrides.get(rule.id) ?? rule.severity;
      rules.push({ ...rule, severity });
    }

    // Custom rules (excluding disabled)
    for (const rule of this.customRules) {
      if (this.disabledIds.has(rule.id)) continue;
      const severity = this.severityOverrides.get(rule.id) ?? rule.severity;
      rules.push({ ...rule, severity });
    }

    return rules;
  }

  /**
   * AC6: List all rules with their status (enabled/disabled, source, severity).
   */
  listRules(): SlopRuleStatus[] {
    const statuses: SlopRuleStatus[] = [];

    for (const rule of BUILTIN_SLOP_RULES) {
      statuses.push({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        detection: rule.detection,
        severity: this.severityOverrides.get(rule.id) ?? rule.severity,
        enabled: !this.disabledIds.has(rule.id),
        source: 'builtin',
      });
    }

    for (const rule of this.customRules) {
      statuses.push({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        detection: rule.detection,
        severity: this.severityOverrides.get(rule.id) ?? rule.severity,
        enabled: !this.disabledIds.has(rule.id),
        source: 'custom',
      });
    }

    return statuses;
  }

  private toSlopRule(input: SlopRuleInput): SlopRule {
    return {
      id: input.id,
      name: input.name,
      description: input.description,
      detection: input.detection,
      severity: input.severity,
      detect: input.detect ?? (() => []),
    };
  }
}
