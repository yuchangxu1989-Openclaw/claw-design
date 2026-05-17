import type { RuleSeverity } from './rule-config.js';

export type AntiPatternDetector =
  | 'text-density'
  | 'color-conflict'
  | 'hierarchy-chaos'
  | 'template-trace';

export interface AntiPatternRuleConfig {
  id: string;
  description: string;
  severity: RuleSeverity;
  detector: AntiPatternDetector;
  threshold?: number;
  suggestion: string;
}

export const DEFAULT_ANTI_PATTERN_RULES: AntiPatternRuleConfig[] = [
  {
    id: 'anti-pattern-text-density',
    description: 'Dense text blocks reduce readability and presentation rhythm.',
    severity: 'block',
    detector: 'text-density',
    threshold: 900,
    suggestion: 'Split long sections into more pages and keep each section focused on one idea.',
  },
  {
    id: 'anti-pattern-color-conflict',
    description: 'Too many hard-coded colors weaken brand cohesion and contrast control.',
    severity: 'warn',
    detector: 'color-conflict',
    threshold: 6,
    suggestion: 'Reduce the palette to theme variables and keep accent colors within the approved brand range.',
  },
  {
    id: 'anti-pattern-hierarchy-chaos',
    description: 'Heading levels should reflect a stable information hierarchy.',
    severity: 'warn',
    detector: 'hierarchy-chaos',
    suggestion: 'Restore heading order so sections open with h1/h2 before deeper levels.',
  },
  {
    id: 'anti-pattern-template-trace',
    description: 'Repeated generic headings create a templated, low-signal result.',
    severity: 'warn',
    detector: 'template-trace',
    suggestion: 'Replace boilerplate section names with task-specific headlines and conclusions.',
  },
];
