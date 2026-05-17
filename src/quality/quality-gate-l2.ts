// Quality Gate L2 — semantic checks
// arc42 §5: L2 validates semantic correctness of generated content
// Three checks: semantic coherence, structural completeness, theme compliance

import type { Artifact, QualityReport, QualityItem, QualityConclusion } from '../types.js';
import type { QualityRuleSet, L2RuleConfig } from './rule-config.js';
import { DEFAULT_RULE_SET } from './rule-config.js';
import { DEFAULT_ANTI_PATTERN_RULES } from './anti-pattern-config.js';

export interface QualityGateL2 {
  check(artifact: Artifact): Promise<QualityReport>;
}

/**
 * L2 quality gate — rule-based semantic checks (TD-02: configurable).
 * Rules loaded from QualityRuleSet; falls back to built-in defaults.
 */
export class QualityGateL2Impl implements QualityGateL2 {
  private l2Rules: L2RuleConfig[];

  constructor(rules?: QualityRuleSet) {
    this.l2Rules = (rules ?? DEFAULT_RULE_SET).l2.rules;
  }

  async check(artifact: Artifact): Promise<QualityReport> {
    const items: QualityItem[] = [];

    for (const rule of this.l2Rules) {
      const severity = rule.artifactTypeOverrides?.[artifact.type]?.severity ?? rule.severity;
      switch (rule.check) {
        case 'semantic-coherence':
          items.push(this.checkSemanticCoherence(artifact, severity));
          break;
        case 'structural-completeness':
          items.push(...this.checkStructuralCompleteness(artifact, rule));
          break;
        case 'theme-compliance':
          items.push(this.checkThemeCompliance(artifact, severity));
          break;
        case 'brand-compliance':
          items.push(...this.checkBrandCompliance(artifact, severity));
          break;
        case 'anti-patterns':
          items.push(...this.checkAntiPatterns(artifact, severity));
          break;
      }
    }

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

  /**
   * Semantic coherence: extract title text, tokenize, check overlap with body.
   * If fewer than 30% of title keywords appear in body → warn.
   */
  private checkSemanticCoherence(artifact: Artifact, severity: QualityItem['severity']): QualityItem {
    const html = artifact.html;

    // Extract title from <title>, <h1>, or first heading
    const titleMatch =
      /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) ??
      /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);

    if (!titleMatch) {
      return {
        rule: 'semantic-coherence',
        passed: false,
        severity,
        message: 'No title or h1 found — cannot verify semantic coherence',
      };
    }

    const titleText = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    if (titleText.length === 0) {
      return {
        rule: 'semantic-coherence',
        passed: false,
        severity,
        message: 'Title/h1 is empty',
      };
    }

    // Tokenize: split on whitespace and CJK character boundaries
    const titleTokens = this.tokenize(titleText);
    if (titleTokens.length === 0) {
      return { rule: 'semantic-coherence', passed: true, severity: 'info', message: 'Title too short to tokenize' };
    }

    // Get body text (strip all tags)
    const bodyText = html.replace(/<[^>]+>/g, ' ').toLowerCase();
    const matchCount = titleTokens.filter(t => bodyText.includes(t)).length;
    const overlapRatio = matchCount / titleTokens.length;

    if (overlapRatio < 0.3) {
      return {
        rule: 'semantic-coherence',
        passed: false,
        severity,
        message: `Title-body keyword overlap ${Math.round(overlapRatio * 100)}% (threshold: 30%) — content may not match title`,
      };
    }

    return {
      rule: 'semantic-coherence',
      passed: true,
      severity: 'info',
      message: `Title-body keyword overlap ${Math.round(overlapRatio * 100)}%`,
    };
  }

  /**
   * Structural completeness: check artifact has required sections.
   * - slides: at least 1 title-like section + 1 content section (min 2 sections)
   * - chart/arch-diagram: at least 1 section with content
   * - all types: must have <body> content
   */
  private checkStructuralCompleteness(artifact: Artifact, rule: L2RuleConfig): QualityItem[] {
    const items: QualityItem[] = [];
    const html = artifact.html;
    const severity = rule.artifactTypeOverrides?.[artifact.type]?.severity ?? rule.severity;

    // Check body has content
    const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
    const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    if (bodyText.length === 0) {
      items.push({
        rule: 'structural-body-content',
        passed: false,
        severity: 'block',
        message: 'Body has no text content',
      });
      return items;
    }
    items.push({ rule: 'structural-body-content', passed: true, severity: 'info', message: 'Body has text content' });

    // Count sections
    const sections = html.match(/<section[^>]*>/gi) ?? [];

    if (artifact.type === 'slides') {
      // Slides need at least 2 sections (title + content)
      const minSections = rule.artifactTypeOverrides?.['slides']?.threshold ?? 2;
      if (sections.length < minSections) {
        items.push({
          rule: 'structural-slides-sections',
          passed: false,
          severity,
          message: `Slides have ${sections.length} section(s) — expected at least ${minSections} (title + content)`,
        });
      } else {
        items.push({
          rule: 'structural-slides-sections',
          passed: true,
          severity: 'info',
          message: `Slides have ${sections.length} section(s)`,
        });
      }

      // Check for a heading in the first section (title slide)
      const firstSectionMatch = /<section[^>]*>([\s\S]*?)<\/section>/i.exec(html);
      if (firstSectionMatch) {
        const hasHeading = /<h[1-3][^>]*>/i.test(firstSectionMatch[1]);
        if (!hasHeading) {
          items.push({
            rule: 'structural-title-slide',
            passed: false,
            severity,
            message: 'First section has no heading — expected a title slide',
          });
        } else {
          items.push({
            rule: 'structural-title-slide',
            passed: true,
            severity: 'info',
            message: 'Title slide has heading',
          });
        }
      }
    } else {
      // Non-slides: at least 1 section with content
      if (sections.length === 0) {
        // No sections is OK for some types — just check body has content (already checked)
        items.push({
          rule: 'structural-sections',
          passed: true,
          severity: 'info',
          message: 'No <section> tags (acceptable for non-slide artifacts)',
        });
      } else {
        items.push({
          rule: 'structural-sections',
          passed: true,
          severity: 'info',
          message: `${sections.length} section(s) found`,
        });
      }
    }

    return items;
  }

  /**
   * Theme compliance: check that Claw Design CSS variables (--cd-*) are referenced.
   * Artifacts should use the theme system, not hardcoded colors.
   */
  private checkThemeCompliance(artifact: Artifact, severity: QualityItem['severity']): QualityItem {
    const html = artifact.html;
    const cssVarPattern = /var\(--cd-/g;
    const matches = html.match(cssVarPattern) ?? [];

    if (matches.length === 0) {
      return {
        rule: 'theme-compliance',
        passed: false,
        severity,
        message: 'No var(--cd-*) CSS variables found — artifact may not use the theme system',
      };
    }

    return {
      rule: 'theme-compliance',
      passed: true,
      severity: 'info',
      message: `${matches.length} var(--cd-*) reference(s) found`,
    };
  }

  private checkBrandCompliance(artifact: Artifact, severity: QualityItem['severity']): QualityItem[] {
    const qualityContext = this.getQualityContext(artifact);
    const theme = qualityContext.theme as {
      colorPrimary?: string;
      fontHeading?: string;
      fontBody?: string;
      brandKit?: {
        colors?: string[];
        fonts?: string[];
        logo?: { required?: boolean; selectors?: string[] };
        layoutRhythm?: { maxSectionsPerPage?: number };
      };
      baselineLabel?: string;
    } | undefined;
    const brandKit = theme?.brandKit;

    if (!brandKit) {
      return [{
        rule: 'brand-compliance-baseline',
        passed: true,
        severity: 'info',
        group: 'brand',
        message: `No Brand Kit provided. Using baseline style: ${theme?.baselineLabel ?? 'Claw Design Baseline'}.`,
      }];
    }

    const items: QualityItem[] = [];
    const html = artifact.html;
    const htmlLower = html.toLowerCase();

    if (brandKit.colors?.length) {
      const colorMatched = brandKit.colors.some(color =>
        htmlLower.includes(color.toLowerCase()) || theme?.colorPrimary?.toLowerCase() === color.toLowerCase(),
      );
      items.push({
        rule: 'brand-compliance-colors',
        passed: colorMatched,
        severity: colorMatched ? 'info' : severity,
        group: 'brand',
        message: colorMatched
          ? 'Brand color constraints are reflected in the artifact.'
          : 'Brand colors were provided but not reflected in the artifact.',
        suggestion: colorMatched ? undefined : 'Bind the palette to Theme Pack variables or approved brand colors.',
      });
    }

    if (brandKit.fonts?.length) {
      const fontMatched = brandKit.fonts.some(font =>
        html.includes(font) || theme?.fontHeading?.includes(font) || theme?.fontBody?.includes(font),
      );
      items.push({
        rule: 'brand-compliance-fonts',
        passed: fontMatched,
        severity: fontMatched ? 'info' : severity,
        group: 'brand',
        message: fontMatched
          ? 'Font tendency follows the Brand Kit.'
          : 'Brand font tendency is missing from the artifact.',
        suggestion: fontMatched ? undefined : 'Use Theme Pack heading/body fonts or declare the approved fallback stack.',
      });
    }

    if (brandKit.logo?.required) {
      const selectors = brandKit.logo.selectors ?? ['data-brand-logo', 'brand-logo', '<img'];
      const hasLogo = selectors.some(selector => htmlLower.includes(selector.toLowerCase()));
      items.push({
        rule: 'brand-compliance-logo',
        passed: hasLogo,
        severity: hasLogo ? 'info' : severity,
        group: 'brand',
        message: hasLogo
          ? 'Logo usage marker found in the artifact.'
          : 'Brand Kit requires a logo, but no logo marker was found.',
        suggestion: hasLogo ? undefined : 'Embed the approved logo or add a branded mark in the primary visual area.',
      });
    }

    if (brandKit.layoutRhythm?.maxSectionsPerPage) {
      const sectionCount = (artifact.html.match(/<section[^>]*>/gi) ?? []).length;
      const ratio = sectionCount / Math.max(artifact.pages, 1);
      const withinRhythm = ratio <= brandKit.layoutRhythm.maxSectionsPerPage;
      items.push({
        rule: 'brand-compliance-rhythm',
        passed: withinRhythm,
        severity: withinRhythm ? 'info' : severity,
        group: 'brand',
        message: withinRhythm
          ? 'Layout rhythm stays within Brand Kit bounds.'
          : `Average sections per page (${ratio.toFixed(1)}) exceeds the Brand Kit rhythm limit.`,
        suggestion: withinRhythm ? undefined : 'Reduce module density or spread content across more pages.',
      });
    }

    return items;
  }

  private checkAntiPatterns(artifact: Artifact, fallbackSeverity: QualityItem['severity']): QualityItem[] {
    const qualityContext = this.getQualityContext(artifact);
    const allowWaivers = new Set<string>((qualityContext.allowStyleExceptions as string[] | undefined) ?? []);
    const html = artifact.html;
    const strippedSections = (html.match(/<section[^>]*>[\s\S]*?<\/section>/gi) ?? [])
      .map(section => section.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    const headingLevels = [...html.matchAll(/<h([1-6])[^>]*>/gi)].map(match => Number(match[1]));
    const colorMatches = html.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)/g) ?? [];
    const uniqueColors = new Set(colorMatches.map(color => color.toLowerCase()));
    const normalizedHeadings = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
      .map(match => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase())
      .filter(Boolean);
    const repeatedHeadings = normalizedHeadings.filter((heading, index) => normalizedHeadings.indexOf(heading) !== index);

    return DEFAULT_ANTI_PATTERN_RULES.map(rule => {
      const severity = allowWaivers.has(rule.id) ? 'warn' : (rule.severity ?? fallbackSeverity);
      switch (rule.detector) {
        case 'text-density': {
          const threshold = rule.threshold ?? 900;
          const denseSections = strippedSections.filter(section => section.length > threshold);
          return {
            rule: rule.id,
            passed: denseSections.length === 0,
            severity: denseSections.length === 0 ? 'info' : severity,
            group: 'anti-pattern',
            message: denseSections.length === 0
              ? 'Text density stays within presentation limits.'
              : `${denseSections.length} section(s) are too text-dense for a clean design rhythm.`,
            suggestion: denseSections.length === 0 ? undefined : rule.suggestion,
          };
        }
        case 'color-conflict': {
          const limit = rule.threshold ?? 6;
          const passed = uniqueColors.size <= limit || html.includes('var(--cd-');
          return {
            rule: rule.id,
            passed,
            severity: passed ? 'info' : severity,
            group: 'anti-pattern',
            message: passed
              ? 'Color palette remains controlled.'
              : `Detected ${uniqueColors.size} hard-coded colors, which suggests palette drift.`,
            suggestion: passed ? undefined : rule.suggestion,
          };
        }
        case 'hierarchy-chaos': {
          const passed = headingLevels.length === 0 || !headingLevels.some((level, index) =>
            index > 0 && level - headingLevels[index - 1] > 1,
          );
          return {
            rule: rule.id,
            passed,
            severity: passed ? 'info' : severity,
            group: 'anti-pattern',
            message: passed
              ? 'Heading hierarchy is stable.'
              : 'Heading levels skip unexpectedly, which weakens information hierarchy.',
            suggestion: passed ? undefined : rule.suggestion,
          };
        }
        case 'template-trace': {
          const passed = repeatedHeadings.length === 0;
          return {
            rule: rule.id,
            passed,
            severity: passed ? 'info' : severity,
            group: 'anti-pattern',
            message: passed
              ? 'No templated heading residue detected.'
              : `Repeated generic headings found: ${[...new Set(repeatedHeadings)].join(', ')}`,
            suggestion: passed ? undefined : rule.suggestion,
          };
        }
      }
    });
  }

  private getQualityContext(artifact: Artifact): Record<string, unknown> {
    const context = artifact.metadata['qualityContext'];
    return typeof context === 'object' && context !== null ? context as Record<string, unknown> : {};
  }

  /**
   * Tokenize text into meaningful keywords.
   * Handles both CJK (split into 2-char bigrams) and Latin (split on whitespace, filter stopwords).
   */
  private tokenize(text: string): string[] {
    const lower = text.toLowerCase();
    const tokens: string[] = [];

    // Latin words (3+ chars, skip common stopwords)
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'shall', 'can', 'this', 'that', 'these',
      'those', 'it', 'its', 'not', 'no', 'from', 'about', 'into',
    ]);
    const latinWords = lower.match(/[a-z]{3,}/g) ?? [];
    for (const w of latinWords) {
      if (!stopwords.has(w)) tokens.push(w);
    }

    // CJK bigrams (2-char sliding window)
    const cjkChars = lower.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) ?? [];
    if (cjkChars.length >= 2) {
      for (let i = 0; i < cjkChars.length - 1; i++) {
        tokens.push(cjkChars[i] + cjkChars[i + 1]);
      }
    } else if (cjkChars.length === 1) {
      tokens.push(cjkChars[0]);
    }

    return tokens;
  }
}

/** @deprecated Use QualityGateL2Impl. Kept for backward compat. */
export class QualityGateL2Stub implements QualityGateL2 {
  async check(artifact: Artifact): Promise<QualityReport> {
    return new QualityGateL2Impl().check(artifact);
  }
}
