// Quality Gate Rule Configuration — TD-02
// Extracts hardcoded L1/L2 rules into configurable format.
// Supports: built-in defaults, external JSON config, user-appended rules.

import { readFile } from 'node:fs/promises';

export type RuleSeverity = 'block' | 'warn' | 'info';

/** L1 rule: pattern-based check against artifact HTML */
export interface L1RuleConfig {
  id: string;
  description: string;
  severity: RuleSeverity;
  /** 'contains' = case-insensitive substring match, 'regex' = RegExp test */
  matchType: 'contains' | 'regex';
  pattern: string;
  /** If true, rule passes when pattern is NOT found (e.g. placeholder detection) */
  invertMatch?: boolean;
}

/** L1 structural rule: checks artifact structure (sections, pages, etc.) */
export interface L1StructuralRuleConfig {
  id: string;
  description: string;
  severity: RuleSeverity;
  check: 'min-pages' | 'max-chars-per-section' | 'no-empty-sections' | 'has-html-structure' | 'has-cjk-font';
  /** Threshold value for numeric checks */
  threshold?: number;
}

/** L2 semantic rule config */
export interface L2RuleConfig {
  id: string;
  description: string;
  severity: RuleSeverity;
  check: 'semantic-coherence' | 'structural-completeness' | 'theme-compliance' | 'brand-compliance' | 'anti-patterns';
  /** Per-artifact-type overrides */
  artifactTypeOverrides?: Record<string, { threshold?: number; severity?: RuleSeverity }>;
}

export interface QualityRuleSet {
  version: string;
  l1: {
    patternRules: L1RuleConfig[];
    structuralRules: L1StructuralRuleConfig[];
  };
  l2: {
    rules: L2RuleConfig[];
  };
}

// ── Built-in defaults (migrated from hardcoded rules) ──

const DEFAULT_PLACEHOLDERS = [
  'TODO', 'FIXME', 'Lorem ipsum', '占位', 'placeholder',
  'TBD', 'XXX', 'HACK', '待填写', '待补充', '示例文本',
  'sample text', 'insert text here', 'your text here',
  '[标题]', '[内容]', '[Title]', '[Content]',
];

export const DEFAULT_RULE_SET: QualityRuleSet = {
  version: '1.0.0',
  l1: {
    patternRules: DEFAULT_PLACEHOLDERS.map(p => ({
      id: `no-placeholder-${p.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      description: `Placeholder residue: ${p}`,
      severity: 'block' as RuleSeverity,
      matchType: 'contains' as const,
      pattern: p,
      invertMatch: true,
    })),
    structuralRules: [
      { id: 'html-non-empty', description: 'HTML must not be empty', severity: 'block', check: 'has-html-structure' },
      { id: 'content-density', description: 'Max chars per section', severity: 'block', check: 'max-chars-per-section', threshold: 2000 },
      { id: 'no-empty-sections', description: 'No empty sections', severity: 'block', check: 'no-empty-sections' },
      { id: 'cjk-font', description: 'CJK font declaration present', severity: 'warn', check: 'has-cjk-font' },
      { id: 'page-count', description: 'Page count > 0', severity: 'block', check: 'min-pages', threshold: 1 },
    ],
  },
  l2: {
    rules: [
      {
        id: 'semantic-coherence',
        description: 'Title-body keyword overlap ≥ 30%',
        severity: 'warn',
        check: 'semantic-coherence',
        artifactTypeOverrides: {},
      },
      {
        id: 'structural-completeness',
        description: 'Required sections present per artifact type',
        severity: 'warn',
        check: 'structural-completeness',
        artifactTypeOverrides: {
          slides: { threshold: 2 },
        },
      },
      {
        id: 'theme-compliance',
        description: 'CSS custom properties (--cd-*) usage',
        severity: 'warn',
        check: 'theme-compliance',
      },
      {
        id: 'brand-compliance',
        description: 'Brand Kit and baseline style alignment',
        severity: 'warn',
        check: 'brand-compliance',
      },
      {
        id: 'anti-patterns',
        description: 'Structured anti-pattern checks',
        severity: 'warn',
        check: 'anti-patterns',
      },
    ],
  },
};

/**
 * Load rules from a JSON file, merging with defaults.
 * User rules are appended (not replaced) — existing built-in rules stay.
 */
export async function loadRuleSet(configPath?: string): Promise<QualityRuleSet> {
  if (!configPath) return DEFAULT_RULE_SET;

  let raw: string;
  try {
    raw = await readFile(configPath, 'utf-8');
  } catch {
    // Config file not found — fall back to defaults
    return DEFAULT_RULE_SET;
  }

  const userConfig = JSON.parse(raw) as Partial<QualityRuleSet>;
  return mergeRuleSets(DEFAULT_RULE_SET, userConfig);
}

function mergeRuleSets(base: QualityRuleSet, user: Partial<QualityRuleSet>): QualityRuleSet {
  const existingL1Ids = new Set(base.l1.patternRules.map(r => r.id));
  const existingL1StructIds = new Set(base.l1.structuralRules.map(r => r.id));
  const existingL2Ids = new Set(base.l2.rules.map(r => r.id));

  return {
    version: user.version ?? base.version,
    l1: {
      patternRules: [
        ...base.l1.patternRules,
        ...(user.l1?.patternRules ?? []).filter(r => !existingL1Ids.has(r.id)),
      ],
      structuralRules: [
        ...base.l1.structuralRules,
        ...(user.l1?.structuralRules ?? []).filter(r => !existingL1StructIds.has(r.id)),
      ],
    },
    l2: {
      rules: [
        ...base.l2.rules,
        ...(user.l2?.rules ?? []).filter(r => !existingL2Ids.has(r.id)),
      ],
    },
  };
}
