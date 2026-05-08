// FR-G02 AC3: Separation enforcer — validates that generated HTML
// does NOT contain hardcoded visual parameters (colors, spacing, fonts).
// Integrates with quality gate to block non-compliant output.
import type { DesignSystemPackage, ConstraintViolation } from './types.js';

/**
 * Enforces the separation between content decisions (LLM) and design decisions (package).
 * FR-G02: LLM only does content arrangement; visual params are locked by the package.
 */
export class SeparationEnforcer {
  /**
   * Check that generated HTML respects the separation principle.
   * Returns violations if LLM has made visual decisions it shouldn't have.
   */
  enforce(html: string, pkg: DesignSystemPackage): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];

    violations.push(...this.checkInlineColors(html, pkg));
    violations.push(...this.checkInlineSpacing(html));
    violations.push(...this.checkInlineFontSizes(html));
    violations.push(...this.checkInlineFontFamilies(html, pkg));
    violations.push(...this.checkStyleAttributes(html));

    return violations;
  }

  /**
   * Generate the separation constraint directive to inject into LLM prompts.
   * FR-G02 AC2: Explicit "no custom visual params" instruction.
   */
  generateSeparationDirective(pkg: DesignSystemPackage): string {
    return [
      '=== CONTENT/DESIGN SEPARATION RULES (MANDATORY) ===',
      '',
      'YOUR ROLE: Content arrangement ONLY.',
      '- Choose which sections to include',
      '- Decide what content goes in each section',
      '- Write copy and headings',
      '',
      'NOT YOUR ROLE (handled by design system):',
      '- Colors (use CSS variables only)',
      '- Spacing (use spacing variables only)',
      '- Font sizes (use typography scale only)',
      '- Border radius, shadows, opacity (use design tokens only)',
      '',
      'ABSOLUTE PROHIBITIONS:',
      '- NO hex colors (#xxx), rgb(), hsl() in your output',
      '- NO px values for padding, margin, gap, font-size',
      '- NO font-family declarations',
      '- NO inline style attributes with visual properties',
      '',
      `Design system: "${pkg.name}" (${pkg.id} v${pkg.version})`,
      `Available classes: ${pkg.components.map(c => '.' + c.selector.replace(/ /g, '.')).join(', ')}`,
      '',
      '=== END SEPARATION RULES ===',
    ].join('\n');
  }

  private checkInlineColors(html: string, pkg: DesignSystemPackage): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const allowedHex = new Set(Object.values(pkg.tokens.colors).map(c => c.toLowerCase()));
    // Allow #fff/#000 (and their full forms) unconditionally: these are
    // CSS reset defaults (background: #fff, color: #000) that every design
    // system implicitly relies on. Flagging them would produce false positives
    // on virtually all generated HTML without adding safety value.
    allowedHex.add('#fff');
    allowedHex.add('#ffffff');
    allowedHex.add('#000');
    allowedHex.add('#000000');

    // Check style attributes for hardcoded colors
    const styleRe = /style="([^"]*)"/g;
    let match: RegExpExecArray | null;
    while ((match = styleRe.exec(html)) !== null) {
      const style = match[1];
      const hexRe = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
      let hexMatch: RegExpExecArray | null;
      while ((hexMatch = hexRe.exec(style)) !== null) {
        if (!allowedHex.has(hexMatch[0].toLowerCase())) {
          violations.push({
            ruleId: 'separation-no-inline-color',
            message: `LLM injected hardcoded color "${hexMatch[0]}" — violates content/design separation`,
            location: `style attribute at offset ${match.index}`,
            severity: 'block',
          });
        }
      }
      if (/(?:^|[^-])(?:rgb|hsl)a?\(\s*\d/.test(style)) {
        violations.push({
          ruleId: 'separation-no-inline-color',
          message: 'LLM injected rgb/hsl color function — violates content/design separation',
          location: `style attribute at offset ${match.index}`,
          severity: 'block',
        });
      }
    }

    return violations;
  }

  private checkInlineSpacing(html: string): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const styleRe = /style="([^"]*)"/g;
    let match: RegExpExecArray | null;
    while ((match = styleRe.exec(html)) !== null) {
      const style = match[1];
      // Check for hardcoded px in padding/margin/gap
      const spacingRe = /(?:padding|margin|gap)(?:-(?:top|right|bottom|left))?\s*:\s*\d+px/g;
      let spacingMatch: RegExpExecArray | null;
      while ((spacingMatch = spacingRe.exec(style)) !== null) {
        violations.push({
          ruleId: 'separation-no-inline-spacing',
          message: `LLM injected hardcoded spacing "${spacingMatch[0]}" — must use var(--spacing-*)`,
          location: `style attribute at offset ${match.index}`,
          severity: 'block',
        });
      }
    }
    return violations;
  }

  private checkInlineFontSizes(html: string): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const styleRe = /style="([^"]*)"/g;
    let match: RegExpExecArray | null;
    while ((match = styleRe.exec(html)) !== null) {
      const style = match[1];
      if (/font-size\s*:\s*\d+px/.test(style)) {
        violations.push({
          ruleId: 'separation-no-inline-font-size',
          message: 'LLM injected hardcoded font-size — must use var(--font-size-*)',
          location: `style attribute at offset ${match.index}`,
          severity: 'block',
        });
      }
    }
    return violations;
  }

  private checkInlineFontFamilies(html: string, pkg: DesignSystemPackage): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const allowedFonts = [
      pkg.tokens.typography.fontFamily.heading.toLowerCase(),
      pkg.tokens.typography.fontFamily.body.toLowerCase(),
    ];

    const styleRe = /style="([^"]*)"/g;
    let match: RegExpExecArray | null;
    while ((match = styleRe.exec(html)) !== null) {
      const style = match[1];
      const fontFamilyRe = /font-family\s*:\s*([^;"]+)/g;
      let ffMatch: RegExpExecArray | null;
      while ((ffMatch = fontFamilyRe.exec(style)) !== null) {
        const val = ffMatch[1].toLowerCase().trim();
        if (!val.includes('var(') && !allowedFonts.some(f => val.includes(f.split(',')[0].trim()))) {
          violations.push({
            ruleId: 'separation-no-inline-font-family',
            message: `LLM injected font-family "${ffMatch[1].trim()}" — not in design system`,
            location: `style attribute at offset ${match.index}`,
            severity: 'block',
          });
        }
      }
    }
    return violations;
  }

  private checkStyleAttributes(html: string): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    // Warn about excessive inline styles (>3 properties suggests LLM is making design decisions)
    const styleRe = /style="([^"]*)"/g;
    let match: RegExpExecArray | null;
    while ((match = styleRe.exec(html)) !== null) {
      const style = match[1];
      const propCount = style.split(';').filter(s => s.trim()).length;
      if (propCount > 5) {
        violations.push({
          ruleId: 'separation-excessive-inline-style',
          message: `Inline style with ${propCount} properties suggests LLM is making design decisions — use component classes`,
          location: `style attribute at offset ${match.index}`,
          severity: 'warn',
        });
      }
    }
    return violations;
  }
}
