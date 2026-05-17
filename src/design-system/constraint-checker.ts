// FR-G02: Static analysis — detect hardcoded visual values in generated HTML
import type { DesignSystemPackage, ConstraintViolation } from './types.js';

const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
const RGB_RE = /rgba?\(\s*\d+/;
const HSL_RE = /hsla?\(\s*\d+/;
const PX_VALUE_RE = /:\s*\d+px/g;
const FONT_SIZE_PX_RE = /font-size\s*:\s*\d+px/;

export class HardcodedValueDetector {
  detect(html: string, pkg: DesignSystemPackage): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const styleBlocks = this.extractInlineStyles(html);

    for (const { content, location } of styleBlocks) {
      violations.push(...this.checkColors(content, location, pkg));
      violations.push(...this.checkSpacing(content, location));
      violations.push(...this.checkFontSizes(content, location));
    }

    return violations;
  }

  private extractInlineStyles(html: string): Array<{ content: string; location: string }> {
    const results: Array<{ content: string; location: string }> = [];

    const styleAttrRe = /style="([^"]*)"/g;
    let match: RegExpExecArray | null;
    while ((match = styleAttrRe.exec(html)) !== null) {
      results.push({ content: match[1], location: `inline style at offset ${match.index}` });
    }

    const styleTagRe = /<style[^>]*>([\s\S]*?)<\/style>/g;
    while ((match = styleTagRe.exec(html)) !== null) {
      results.push({ content: match[1], location: `<style> block at offset ${match.index}` });
    }

    return results;
  }

  private checkColors(css: string, location: string, pkg: DesignSystemPackage): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const allowedColors = new Set(Object.values(pkg.tokens.colors).map(c => c.toLowerCase()));

    const hexMatches = css.match(HEX_COLOR_RE) || [];
    for (const hex of hexMatches) {
      if (!allowedColors.has(hex.toLowerCase())) {
        violations.push({
          ruleId: 'no-hardcoded-color',
          message: `Hardcoded color "${hex}" — must use CSS variable from design system`,
          location,
          severity: 'block',
        });
      }
    }

    if (RGB_RE.test(css) || HSL_RE.test(css)) {
      violations.push({
        ruleId: 'no-hardcoded-color',
        message: 'Hardcoded rgb/hsl color — must use CSS variable from design system',
        location,
        severity: 'block',
      });
    }

    return violations;
  }

  private checkSpacing(css: string, location: string): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const pxMatches = css.match(PX_VALUE_RE) || [];

    for (const px of pxMatches) {
      if (!px.includes('font-size') && !px.includes('border-radius')) {
        violations.push({
          ruleId: 'no-hardcoded-spacing',
          message: `Hardcoded spacing "${px.trim()}" — must use spacing variable`,
          location,
          severity: 'block',
        });
      }
    }

    return violations;
  }

  private checkFontSizes(css: string, location: string): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    if (FONT_SIZE_PX_RE.test(css)) {
      violations.push({
        ruleId: 'no-hardcoded-font-size',
        message: 'Hardcoded font-size — must use typography scale variable',
        location,
        severity: 'block',
      });
    }
    return violations;
  }
}
