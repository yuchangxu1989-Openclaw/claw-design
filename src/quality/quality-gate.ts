// Quality Gate L1 — configurable rule-based checks (TD-02)
// Rules loaded from QualityRuleSet config; falls back to built-in defaults.

import type { Artifact, QualityReport, QualityItem, QualityConclusion } from '../types.js';
import type { QualityRuleSet, L1RuleConfig, L1StructuralRuleConfig } from './rule-config.js';
import { DEFAULT_RULE_SET } from './rule-config.js';
import { checkAllClarificationRules } from './clarification-quality-rules.js';

export class QualityGateL1 {
  private rules: QualityRuleSet;

  constructor(rules?: QualityRuleSet) {
    this.rules = rules ?? DEFAULT_RULE_SET;
  }

  check(artifact: Artifact): QualityReport {
    const items: QualityItem[] = [];

    // Run pattern rules (placeholder detection, etc.)
    items.push(...this.runPatternRules(artifact));

    // Run prototype-specific interaction checks
    if (artifact.type === 'prototype') {
      items.push(...checkAllClarificationRules(artifact));
    }

    // Run structural rules
    items.push(...this.runStructuralRules(artifact));

    const hasBlock = items.some(i => !i.passed && i.severity === 'block');
    const hasWarn = items.some(i => !i.passed && i.severity === 'warn');
    let conclusion: QualityConclusion = 'pass';
    if (hasBlock) conclusion = 'block';
    else if (hasWarn) conclusion = 'warn';

    return {
      taskId: artifact.taskId,
      conclusion,
      items,
      checkedAt: new Date().toISOString(),
    };
  }

  private runPatternRules(artifact: Artifact): QualityItem[] {
    const items: QualityItem[] = [];
    const html = artifact.html ?? '';
    const htmlLower = html.toLowerCase();

    // Group all placeholder pattern rules into a single check
    const placeholderRules = this.rules.l1.patternRules.filter(r => r.invertMatch);
    const otherRules = this.rules.l1.patternRules.filter(r => !r.invertMatch);

    // Placeholder detection: invertMatch rules — fail when pattern IS found
    if (placeholderRules.length > 0) {
      const found = placeholderRules.filter(r => this.matchPattern(r, htmlLower));
      if (found.length > 0) {
        items.push({
          rule: 'no-placeholders',
          passed: false,
          severity: 'block',
          message: `Placeholder content found: ${found.map(r => r.pattern).join(', ')}`,
        });
      } else {
        items.push({ rule: 'no-placeholders', passed: true, severity: 'info', message: 'No placeholder residue' });
      }
    }

    // Other pattern rules: fail when pattern is NOT found
    for (const rule of otherRules) {
      const matched = this.matchPattern(rule, htmlLower);
      items.push({
        rule: rule.id,
        passed: matched,
        severity: matched ? 'info' : rule.severity,
        message: matched ? rule.description : `Failed: ${rule.description}`,
      });
    }

    return items;
  }

  /**
   * Extract visible text content from HTML, stripping tags and attributes.
   * This prevents HTML attributes like placeholder="..." from triggering
   * false positives in placeholder-detection rules.
   */
  private extractTextContent(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private matchPattern(rule: L1RuleConfig, htmlLower: string): boolean {
    // For placeholder-detection (invertMatch) rules, check text content only
    // to avoid false positives from HTML attributes like placeholder="..."
    const target = rule.invertMatch ? this.extractTextContent(htmlLower) : htmlLower;
    if (rule.matchType === 'contains') {
      return target.includes(rule.pattern.toLowerCase());
    }
    return new RegExp(rule.pattern, 'i').test(target);
  }

  private runStructuralRules(artifact: Artifact): QualityItem[] {
    const items: QualityItem[] = [];
    const html = artifact.html ?? '';

    for (const rule of this.rules.l1.structuralRules) {
      switch (rule.check) {
        case 'has-html-structure': {
          const hasHtml = /<html[\s>]/i.test(html);
          const hasBody = /<body[\s>]/i.test(html);
          const nonEmpty = html.trim().length > 0;
          if (!nonEmpty) {
            items.push({ rule: 'html-non-empty', passed: false, severity: 'block', message: 'Artifact HTML is empty' });
          } else {
            items.push({ rule: 'html-non-empty', passed: true, severity: 'info', message: 'HTML content present' });
          }
          if (!hasHtml || !hasBody) {
            items.push({ rule: 'html-structure', passed: false, severity: 'block', message: 'Missing <html> or <body> tag' });
          } else {
            items.push({ rule: 'html-structure', passed: true, severity: 'info', message: 'HTML structure valid' });
          }
          break;
        }
        case 'max-chars-per-section': {
          const sections = html.match(/<section[^>]*>[\s\S]*?<\/section>/gi) ?? [];
          if (sections.length > 0) {
            const max = rule.threshold ?? 2000;
            const stuffed = sections.filter(s => s.replace(/<[^>]+>/g, '').trim().length > max);
            if (stuffed.length > 0) {
              items.push({ rule: rule.id, passed: false, severity: rule.severity, message: `${stuffed.length} section(s) exceed ${max} chars — possible content stuffing` });
            } else {
              items.push({ rule: rule.id, passed: true, severity: 'info', message: 'Content density within limits' });
            }
          }
          break;
        }
        case 'no-empty-sections': {
          const sections = html.match(/<section[^>]*>[\s\S]*?<\/section>/gi) ?? [];
          if (sections.length > 0) {
            const empty = sections.filter(s => s.replace(/<[^>]+>/g, '').trim().length === 0);
            if (empty.length > 0) {
              items.push({ rule: rule.id, passed: false, severity: rule.severity, message: `${empty.length} empty section(s) detected` });
            } else {
              items.push({ rule: rule.id, passed: true, severity: 'info', message: 'No empty sections' });
            }
          }
          break;
        }
        case 'has-cjk-font': {
          const hasCjk = /Noto Sans (SC|JP|KR)|PingFang|Microsoft YaHei|Source Han/i.test(html);
          items.push({
            rule: rule.id,
            passed: hasCjk,
            severity: hasCjk ? 'info' : rule.severity,
            message: hasCjk ? 'CJK font declared' : 'No CJK font declared in HTML',
          });
          break;
        }
        case 'min-pages': {
          const min = rule.threshold ?? 1;
          const ok = artifact.pages >= min;
          items.push({
            rule: rule.id,
            passed: ok,
            severity: ok ? 'info' : rule.severity,
            message: ok ? `${artifact.pages} page(s)` : `Page count is ${artifact.pages} (min: ${min})`,
          });
          break;
        }
      }
    }

    return items;
  }
}
