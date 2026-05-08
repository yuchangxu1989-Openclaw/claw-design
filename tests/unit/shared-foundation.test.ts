import { describe, expect, it } from 'vitest';
import {
  getLayoutSkeleton, LAYOUT_SKELETONS, getLayoutCss,
  getPalette, BUILT_IN_PALETTES, paletteToCssVars, deriveContrastColor,
  getFontScale, fontSpecToCss, fontScaleToCssBlock, DEFAULT_FONT_SCALE,
  getIcon, getAllIcons, renderIcon, getIconsByCategory,
  checkAntiPatterns, ANTI_PATTERN_RULES,
} from '../../src/skills/shared/index.js';

describe('FR-B11: Skill Shared Foundation', () => {
  describe('Layout Engine', () => {
    it('AC1: provides layout skeletons', () => {
      expect(LAYOUT_SKELETONS.length).toBeGreaterThanOrEqual(4);
    });

    it('AC2: layouts have slots and css', () => {
      const layout = getLayoutSkeleton('two-column');
      expect(layout).toBeDefined();
      expect(layout!.slots.length).toBe(2);
      expect(layout!.css).toContain('grid');
    });

    it('AC3: getLayoutCss returns css string', () => {
      const css = getLayoutCss('header-body');
      expect(css).toContain('flex');
    });
  });

  describe('Color System', () => {
    it('AC1: provides built-in palettes', () => {
      expect(BUILT_IN_PALETTES.length).toBeGreaterThanOrEqual(3);
    });

    it('AC2: palette converts to CSS vars', () => {
      const palette = getPalette('business-blue')!;
      const vars = paletteToCssVars(palette);
      expect(vars['--cd-color-primary']).toBe('#1a73e8');
      expect(vars['--cd-color-bg']).toBe('#ffffff');
    });

    it('AC2: deriveContrastColor works', () => {
      expect(deriveContrastColor('#ffffff')).toBe('#202124');
      expect(deriveContrastColor('#000000')).toBe('#ffffff');
    });
  });

  describe('Font Manager', () => {
    it('AC1: provides font scales', () => {
      const scale = getFontScale('default');
      expect(scale.h1.size).toBeTruthy();
      expect(scale.body.size).toBeTruthy();
    });

    it('AC2: fontSpecToCss generates valid CSS', () => {
      const css = fontSpecToCss(DEFAULT_FONT_SCALE.h1);
      expect(css).toContain('font-size');
      expect(css).toContain('font-weight');
    });

    it('AC2: fontScaleToCssBlock generates class rules', () => {
      const block = fontScaleToCssBlock(DEFAULT_FONT_SCALE);
      expect(block).toContain('.cd-h1');
      expect(block).toContain('.cd-body');
    });
  });

  describe('Icon Library', () => {
    it('AC1: provides icons', () => {
      const icons = getAllIcons();
      expect(icons.length).toBeGreaterThanOrEqual(5);
    });

    it('AC1: icons have categories', () => {
      const statusIcons = getIconsByCategory('status');
      expect(statusIcons.length).toBeGreaterThan(0);
    });

    it('AC2: renderIcon produces SVG', () => {
      const svg = renderIcon('check', 32, 'green');
      expect(svg).toContain('svg');
      expect(svg).toContain('32');
      expect(svg).toContain('green');
    });
  });

  describe('Anti-Pattern Rules', () => {
    it('AC1: provides anti-pattern rules', () => {
      expect(ANTI_PATTERN_RULES.length).toBeGreaterThanOrEqual(4);
    });

    it('AC2: detects empty section', () => {
      const violations = checkAntiPatterns('<section></section>');
      expect(violations.some(v => v.ruleId === 'no-empty-section')).toBe(true);
    });

    it('AC3: clean HTML passes', () => {
      const violations = checkAntiPatterns('<section><p>Content</p></section>');
      const blocks = violations.filter(v => v.severity === 'block');
      expect(blocks.length).toBe(0);
    });
  });
});
