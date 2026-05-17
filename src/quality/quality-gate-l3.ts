// Quality Gate L3 — visual & layout checks (FR-D03) + optional semantic cross validation

import type {
  Artifact,
  QualityReport,
  QualityItem,
  QualityConclusion,
  SemanticValidationConfig,
} from '../types.js';
import {
  HeuristicSemanticValidator,
  shouldRunSemanticValidation,
  type SemanticValidator,
} from './semantic-cross-validator.js';

export interface SemanticValidationOptions {
  requestInput?: string;
  semanticValidation?: SemanticValidationConfig;
  validator?: SemanticValidator;
}

export interface QualityGateL3 {
  check(artifact: Artifact, options?: SemanticValidationOptions): Promise<QualityReport>;
}

/** Passes through, interface ready for vision-model-based visual checks */
export class QualityGateL3Stub implements QualityGateL3 {
  async check(artifact: Artifact, _options?: SemanticValidationOptions): Promise<QualityReport> {
    const items: QualityItem[] = [
      {
        rule: 'visual-rendering',
        passed: true,
        severity: 'info',
        message: 'L3 visual check stub — not yet implemented',
      },
    ];

    return {
      taskId: artifact.taskId,
      conclusion: 'pass' as QualityConclusion,
      items,
      checkedAt: new Date().toISOString(),
    };
  }
}

// ── Visual & layout check helpers (HTML structure-based, no browser rendering) ──

/** Extract inline font-size values from style attributes and <style> blocks */
function extractFontSizes(html: string): { selector: string; size: number }[] {
  const results: { selector: string; size: number }[] = [];

  // Inline style font-size on elements
  const inlineRe = /<(h[1-6]|p|span|div|li|td|th|a|label|small|strong|em|figcaption)[^>]*style="[^"]*font-size:\s*([\d.]+)(px|pt|rem|em)/gi;
  let m: RegExpExecArray | null;
  while ((m = inlineRe.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    let size = parseFloat(m[2]);
    const unit = m[3];
    if (unit === 'pt') size *= 1.333;
    else if (unit === 'rem' || unit === 'em') size *= 16;
    results.push({ selector: tag, size });
  }

  // CSS rule blocks: tag { font-size: Xpx }
  const cssBlockRe = /(h[1-6]|p|body|small|figcaption|label|span|div|li|td|th|a|strong|em|\.[\w-]+)\s*\{[^}]*font-size:\s*([\d.]+)(px|pt|rem|em)/gi;
  while ((m = cssBlockRe.exec(html)) !== null) {
    let size = parseFloat(m[2]);
    const unit = m[3];
    if (unit === 'pt') size *= 1.333;
    else if (unit === 'rem' || unit === 'em') size *= 16;
    results.push({ selector: m[1].toLowerCase(), size });
  }

  return results;
}

/** Check font-size hierarchy: headings > body > captions/small */
function checkFontHierarchy(html: string): QualityItem {
  const sizes = extractFontSizes(html);
  if (sizes.length < 2) {
    return { rule: 'visual-font-hierarchy', passed: true, severity: 'info', message: 'Insufficient font-size declarations to check hierarchy' };
  }

  const headingSizes = sizes.filter(s => /^h[1-6]$/.test(s.selector)).map(s => s.size);
  const bodySizes = sizes.filter(s => s.selector === 'p' || s.selector === 'body' || s.selector === 'div' || s.selector === 'span' || s.selector === 'li').map(s => s.size);
  const captionSizes = sizes.filter(s => s.selector === 'small' || s.selector === 'figcaption' || s.selector === 'label').map(s => s.size);

  const minHeading = headingSizes.length > 0 ? Math.min(...headingSizes) : Infinity;
  const maxBody = bodySizes.length > 0 ? Math.max(...bodySizes) : 0;
  const maxCaption = captionSizes.length > 0 ? Math.max(...captionSizes) : 0;

  const violations: string[] = [];
  if (headingSizes.length > 0 && bodySizes.length > 0 && minHeading <= maxBody) {
    violations.push(`smallest heading (${minHeading}px) ≤ largest body text (${maxBody}px)`);
  }
  if (bodySizes.length > 0 && captionSizes.length > 0 && maxCaption >= maxBody) {
    violations.push(`caption/small (${maxCaption}px) ≥ body text (${maxBody}px)`);
  }

  if (violations.length > 0) {
    return {
      rule: 'visual-font-hierarchy',
      passed: false,
      severity: 'warn',
      message: `Font hierarchy violation: ${violations.join('; ')}`,
      suggestion: 'Ensure heading font sizes > body text > captions/annotations.',
    };
  }

  return { rule: 'visual-font-hierarchy', passed: true, severity: 'info', message: 'Font-size hierarchy is consistent' };
}

/** Approximate color luminance from hex */
function hexLuminance(hex: string): number | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 3 && clean.length !== 6) return null;
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio between two luminances */
function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check color contrast between text color and background.
 *
 * Known limitation: only detects color pairs declared via inline `style`
 * attributes (e.g. `style="color:#fff; background:#000"`). Colors applied
 * through CSS classes, external stylesheets, or CSS custom properties are
 * invisible to this heuristic. Use an external tool such as axe-core or
 * Lighthouse for comprehensive contrast auditing.
 */
function checkColorContrast(html: string): QualityItem {
  // Extract color + background-color pairs from inline styles
  const pairRe = /style="[^"]*(?:color:\s*(#[0-9a-fA-F]{3,6}))[^"]*(?:background(?:-color)?:\s*(#[0-9a-fA-F]{3,6}))/gi;
  const pairReReverse = /style="[^"]*(?:background(?:-color)?:\s*(#[0-9a-fA-F]{3,6}))[^"]*(?:(?<!-)color:\s*(#[0-9a-fA-F]{3,6}))/gi;

  const pairs: Array<{ fg: string; bg: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = pairRe.exec(html)) !== null) {
    pairs.push({ fg: m[1], bg: m[2] });
  }
  while ((m = pairReReverse.exec(html)) !== null) {
    pairs.push({ fg: m[2], bg: m[1] });
  }

  if (pairs.length === 0) {
    return { rule: 'visual-color-contrast', passed: true, severity: 'info', message: 'No inline color pairs to check contrast' };
  }

  const lowContrast: string[] = [];
  for (const { fg, bg } of pairs) {
    const fgL = hexLuminance(fg);
    const bgL = hexLuminance(bg);
    if (fgL === null || bgL === null) continue;
    const ratio = contrastRatio(fgL, bgL);
    if (ratio < 3.0) {
      lowContrast.push(`${fg}/${bg} (ratio ${ratio.toFixed(1)})`);
    }
  }

  if (lowContrast.length > 0) {
    return {
      rule: 'visual-color-contrast',
      passed: false,
      severity: 'warn',
      message: `Low contrast pairs: ${lowContrast.join(', ')}`,
      suggestion: 'Increase contrast ratio to at least 3:1 for readability.',
    };
  }

  return { rule: 'visual-color-contrast', passed: true, severity: 'info', message: 'Color contrast acceptable' };
}

/** Check whitespace balance — sections with very little padding/margin */
function checkWhitespace(html: string): QualityItem {
  // Count sections and check for padding/margin declarations
  const sections = html.match(/<section[^>]*>/gi) ?? [];
  if (sections.length === 0) {
    return { rule: 'visual-whitespace', passed: true, severity: 'info', message: 'No sections to check whitespace' };
  }

  const hasPadding = /padding\s*:/i.test(html) || /margin\s*:/i.test(html) || /gap\s*:/i.test(html);
  const hasSpacingVars = /--cd-spacing|--spacing|--gap/i.test(html);

  if (!hasPadding && !hasSpacingVars && sections.length > 2) {
    return {
      rule: 'visual-whitespace',
      passed: false,
      severity: 'warn',
      message: 'No padding/margin/gap declarations found — layout may feel cramped',
      suggestion: 'Add spacing between sections for visual breathing room.',
    };
  }

  return { rule: 'visual-whitespace', passed: true, severity: 'info', message: 'Whitespace declarations present' };
}

/** Check alignment consistency — mixed text-align values */
function checkAlignment(html: string): QualityItem {
  const alignRe = /text-align:\s*(left|right|center|justify)/gi;
  const aligns = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = alignRe.exec(html)) !== null) {
    aligns.add(m[1].toLowerCase());
  }

  // Having 3+ different alignments in one artifact is suspicious
  if (aligns.size >= 3) {
    return {
      rule: 'visual-alignment',
      passed: false,
      severity: 'warn',
      message: `Mixed alignment styles detected: ${[...aligns].join(', ')}`,
      suggestion: 'Use consistent text alignment across sections for visual coherence.',
    };
  }

  return { rule: 'visual-alignment', passed: true, severity: 'info', message: 'Alignment is consistent' };
}

/** Check for overcrowded pages — too many sections relative to page count */
function checkPageDensity(html: string, pages: number): QualityItem {
  const sections = (html.match(/<section[^>]*>/gi) ?? []).length;
  if (pages <= 0 || sections === 0) {
    return { rule: 'visual-page-density', passed: true, severity: 'info', message: 'Page density check skipped' };
  }

  const sectionsPerPage = sections / pages;
  // More than 8 sections per page is very dense
  if (sectionsPerPage > 8) {
    return {
      rule: 'visual-page-density',
      passed: false,
      severity: 'block',
      message: `High page density: ${sections} sections across ${pages} page(s) (${sectionsPerPage.toFixed(1)}/page)`,
      suggestion: 'Reduce content per page or increase page count for readability.',
    };
  }

  if (sectionsPerPage > 5) {
    return {
      rule: 'visual-page-density',
      passed: false,
      severity: 'warn',
      message: `Moderate page density: ${sections} sections across ${pages} page(s) (${sectionsPerPage.toFixed(1)}/page)`,
      suggestion: 'Consider splitting dense pages for better readability.',
    };
  }

  return { rule: 'visual-page-density', passed: true, severity: 'info', message: 'Page density within limits' };
}

/** Check minimum font size — anything below 10px is hard to read */
function checkMinFontSize(html: string): QualityItem {
  const sizes = extractFontSizes(html);
  const tooSmall = sizes.filter(s => s.size > 0 && s.size < 10);

  if (tooSmall.length > 0) {
    const details = tooSmall.map(s => `${s.selector}: ${s.size}px`).join(', ');
    return {
      rule: 'visual-min-font-size',
      passed: false,
      severity: 'warn',
      message: `Font size below 10px: ${details}`,
      suggestion: 'Use at least 10px for readability; 12px+ recommended for body text.',
    };
  }

  return { rule: 'visual-min-font-size', passed: true, severity: 'info', message: 'All font sizes ≥ 10px' };
}

// ── Main L3 implementation ──

export class QualityGateL3Impl implements QualityGateL3 {
  constructor(private readonly validator: SemanticValidator = new HeuristicSemanticValidator()) {}

  async check(artifact: Artifact, options?: SemanticValidationOptions): Promise<QualityReport> {
    const items: QualityItem[] = [];

    // ── FR-D03 visual & layout checks ──
    items.push(checkFontHierarchy(artifact.html));
    items.push(checkColorContrast(artifact.html));
    items.push(checkWhitespace(artifact.html));
    items.push(checkAlignment(artifact.html));
    items.push(checkPageDensity(artifact.html, artifact.pages));
    items.push(checkMinFontSize(artifact.html));

    // ── Semantic cross-validation (existing behavior) ──
    if (shouldRunSemanticValidation(options?.semanticValidation)) {
      const requestInput = options?.requestInput ?? '';
      const acknowledged = options?.semanticValidation?.userAcknowledgedCost ?? false;
      const result = await (options?.validator ?? this.validator).validate(requestInput, artifact);
      const item: QualityItem = {
        rule: 'semantic-cross-validation',
        passed: result.passed && acknowledged,
        severity: result.passed && acknowledged ? 'info' : 'warn',
        group: 'semantic',
        message: acknowledged
          ? `${result.rationale} Provider=${result.provider}, score=${result.score.toFixed(2)}.`
          : 'Semantic validation was enabled without explicit cost/latency acknowledgement.',
        suggestion: acknowledged
          ? (result.passed ? undefined : 'Revise the artifact so its titles and conclusions respond more directly to the user request.')
          : 'Set userAcknowledgedCost=true before running semantic cross validation.',
      };
      items.push(item);
    }

    // ── Conclusion ──
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
}
