import { describe, expect, it } from 'vitest';
import { PackageSchemaValidator } from '../../src/design-system/schema-validator.js';
import { CssGenerator } from '../../src/design-system/css-generator.js';
import { SeparationEnforcer } from '../../src/design-system/separation-enforcer.js';
import { ReferencePageMatcher } from '../../src/design-system/reference-matcher.js';
import { DARK_SCI_FI_PACKAGE } from '../../src/design-system/packages/dark-sci-fi.js';
import type { DesignSystemPackage } from '../../src/design-system/types.js';

const minimalPackage: DesignSystemPackage = {
  id: 'test-pkg',
  name: 'Test Package',
  version: '1.0.0',
  tokens: {
    colors: { 'primary': '#ff0000', 'bg': '#000000', 'ink': '#ffffff' },
    spacing: { unit: '8px', values: { sm: '8px', md: '16px', lg: '24px' } },
    typography: {
      fontFamily: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' },
      sizes: { sm: '12px', md: '16px', lg: '24px' },
      weights: { normal: '400', bold: '700' },
      lineHeights: { normal: '1.5', tight: '1.2' },
    },
    radius: { sm: '4px', md: '8px' },
    shadows: { card: '0 2px 4px rgba(0,0,0,.1)' },
    opacity: { light: '0.1', medium: '0.5' },
  },
  components: [
    { name: 'card', selector: 'card', properties: { border: '1px solid var(--line)', 'border-radius': 'var(--radius-md)' } },
    { name: 'btn-primary', selector: 'btn primary', properties: { background: 'var(--primary)', color: 'var(--ink)' } },
  ],
  reference: { html: '<div class="card"><h3>Reference</h3><p>Content</p></div>' },
  constraints: { enforce: [], forbid: [] },
};

// ============================================================
// FR-G01: PackageSchemaValidator
// ============================================================
describe('PackageSchemaValidator (FR-G01)', () => {
  const validator = new PackageSchemaValidator();

  it('validates a correct package', () => {
    const result = validator.validate(minimalPackage);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates the built-in dark-sci-fi package', () => {
    const result = validator.validate(DARK_SCI_FI_PACKAGE);
    expect(result.valid).toBe(true);
  });

  it('rejects null input', () => {
    const result = validator.validate(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('non-null object');
  });

  it('rejects missing id', () => {
    const { id, ...noId } = minimalPackage;
    const result = validator.validate(noId);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.path === 'id')).toBe(true);
  });

  it('rejects empty name', () => {
    const result = validator.validate({ ...minimalPackage, name: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.path === 'name')).toBe(true);
  });

  it('rejects missing tokens', () => {
    const { tokens, ...noTokens } = minimalPackage;
    const result = validator.validate(noTokens);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.path === 'tokens')).toBe(true);
  });

  it('rejects empty colors', () => {
    const pkg = { ...minimalPackage, tokens: { ...minimalPackage.tokens, colors: {} } };
    const result = validator.validate(pkg);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.path === 'tokens.colors')).toBe(true);
  });

  it('rejects missing components array', () => {
    const result = validator.validate({ ...minimalPackage, components: 'not-array' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.path === 'components')).toBe(true);
  });

  it('rejects component without selector', () => {
    const result = validator.validate({
      ...minimalPackage,
      components: [{ name: 'card', properties: {} }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.path.includes('selector'))).toBe(true);
  });

  it('rejects missing reference', () => {
    const { reference, ...noRef } = minimalPackage;
    const result = validator.validate(noRef);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.path === 'reference')).toBe(true);
  });

  it('rejects empty reference.html', () => {
    const result = validator.validate({ ...minimalPackage, reference: { html: '' } });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.path === 'reference.html')).toBe(true);
  });

  it('rejects missing constraints', () => {
    const { constraints, ...noCons } = minimalPackage;
    const result = validator.validate(noCons);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.path === 'constraints')).toBe(true);
  });

  it('validateOrThrow returns typed package on success', () => {
    const result = validator.validateOrThrow(minimalPackage);
    expect(result.id).toBe('test-pkg');
  });

  it('validateOrThrow throws on invalid input', () => {
    expect(() => validator.validateOrThrow({})).toThrow('Invalid DesignSystemPackage');
  });

  it('supports multiple style instances (multi-style coexistence)', () => {
    const pkg2: DesignSystemPackage = { ...minimalPackage, id: 'light-minimal', name: 'Light Minimal' };
    expect(validator.validate(pkg2).valid).toBe(true);
    expect(validator.validate(DARK_SCI_FI_PACKAGE).valid).toBe(true);
  });
});

// ============================================================
// FR-G01 AC1: CssGenerator — packages as CSS variables + classes
// ============================================================
describe('CssGenerator (FR-G01 AC1)', () => {
  const generator = new CssGenerator();

  it('generates :root block with all color tokens', () => {
    const css = generator.generateRootVariables(minimalPackage);
    expect(css).toContain(':root {');
    expect(css).toContain('--primary: #ff0000;');
    expect(css).toContain('--bg: #000000;');
    expect(css).toContain('--ink: #ffffff;');
  });

  it('generates spacing variables', () => {
    const css = generator.generateRootVariables(minimalPackage);
    expect(css).toContain('--spacing-sm: 8px;');
    expect(css).toContain('--spacing-md: 16px;');
    expect(css).toContain('--spacing-lg: 24px;');
  });

  it('generates typography variables', () => {
    const css = generator.generateRootVariables(minimalPackage);
    expect(css).toContain('--font-size-sm: 12px;');
    expect(css).toContain('--font-size-lg: 24px;');
    expect(css).toContain('--font-weight-normal: 400;');
    expect(css).toContain('--line-height-normal: 1.5;');
  });

  it('generates radius, shadow, opacity variables', () => {
    const css = generator.generateRootVariables(minimalPackage);
    expect(css).toContain('--radius-sm: 4px;');
    expect(css).toContain('--shadow-card:');
    expect(css).toContain('--opacity-light: 0.1;');
  });

  it('generates component class rules', () => {
    const css = generator.generateComponentClasses(minimalPackage);
    expect(css).toContain('.card {');
    expect(css).toContain('border: 1px solid var(--line);');
    // Multi-word selector: "btn primary" → ".btn.primary"
    expect(css).toContain('.btn.primary {');
  });

  it('generate() produces complete stylesheet', () => {
    const css = generator.generate(minimalPackage);
    expect(css).toContain(':root {');
    expect(css).toContain('.card {');
    expect(css).toContain('box-sizing: border-box');
  });

  it('generateHtmlWrapper produces valid HTML', () => {
    const html = generator.generateHtmlWrapper(minimalPackage, '<p>Hello</p>');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Test Package');
    expect(html).toContain('<p>Hello</p>');
    expect(html).toContain('--primary: #ff0000;');
  });

  it('works with dark-sci-fi package', () => {
    const css = generator.generate(DARK_SCI_FI_PACKAGE);
    expect(css).toContain('--bg: #0b0612;');
    expect(css).toContain('--accent-a: #ec4899;');
    expect(css).toContain('.card {');
  });

  it('CSS is independently loadable (no external dependencies)', () => {
    const css = generator.generate(minimalPackage);
    // Should not contain @import or url() references
    expect(css).not.toContain('@import');
    expect(css).not.toMatch(/url\([^)]+\)/);
  });
});

// ============================================================
// FR-G02: SeparationEnforcer — LLM content only, no visual decisions
// ============================================================
describe('SeparationEnforcer (FR-G02)', () => {
  const enforcer = new SeparationEnforcer();

  it('passes clean HTML using only CSS variables (AC1)', () => {
    const html = '<div class="card" style="color: var(--primary); padding: var(--spacing-md)"><h3>Title</h3></div>';
    const violations = enforcer.enforce(html, minimalPackage);
    expect(violations.filter(v => v.severity === 'block')).toHaveLength(0);
  });

  it('detects hardcoded hex color in inline style (AC1)', () => {
    const html = '<div style="color: #ff5500">bad</div>';
    const violations = enforcer.enforce(html, minimalPackage);
    expect(violations.some(v => v.ruleId === 'separation-no-inline-color')).toBe(true);
  });

  it('allows package-defined colors in inline style', () => {
    const html = '<div style="color: #ff0000">ok</div>';
    const violations = enforcer.enforce(html, minimalPackage);
    expect(violations.filter(v => v.ruleId === 'separation-no-inline-color')).toHaveLength(0);
  });

  it('detects rgb() color function (AC1)', () => {
    const html = '<div style="background: rgb(255, 0, 0)">bad</div>';
    const violations = enforcer.enforce(html, minimalPackage);
    expect(violations.some(v => v.ruleId === 'separation-no-inline-color')).toBe(true);
  });

  it('detects hardcoded px spacing (AC1)', () => {
    const html = '<div style="padding: 20px">bad</div>';
    const violations = enforcer.enforce(html, minimalPackage);
    expect(violations.some(v => v.ruleId === 'separation-no-inline-spacing')).toBe(true);
  });

  it('detects hardcoded font-size (AC1)', () => {
    const html = '<div style="font-size: 18px">bad</div>';
    const violations = enforcer.enforce(html, minimalPackage);
    expect(violations.some(v => v.ruleId === 'separation-no-inline-font-size')).toBe(true);
  });

  it('detects external font-family (AC1)', () => {
    const html = '<div style="font-family: Roboto, Arial">bad</div>';
    const violations = enforcer.enforce(html, minimalPackage);
    expect(violations.some(v => v.ruleId === 'separation-no-inline-font-family')).toBe(true);
  });

  it('allows package font-family', () => {
    const html = '<div style="font-family: Inter, sans-serif">ok</div>';
    const violations = enforcer.enforce(html, minimalPackage);
    expect(violations.filter(v => v.ruleId === 'separation-no-inline-font-family')).toHaveLength(0);
  });

  it('warns on excessive inline styles (>5 properties)', () => {
    const html = '<div style="color: var(--ink); display: flex; align-items: center; justify-content: center; flex-direction: column; flex-wrap: wrap">many</div>';
    const violations = enforcer.enforce(html, minimalPackage);
    expect(violations.some(v => v.ruleId === 'separation-excessive-inline-style')).toBe(true);
    expect(violations.find(v => v.ruleId === 'separation-excessive-inline-style')?.severity).toBe('warn');
  });

  it('generates separation directive for LLM prompt (AC2)', () => {
    const directive = enforcer.generateSeparationDirective(minimalPackage);
    expect(directive).toContain('CONTENT/DESIGN SEPARATION RULES');
    expect(directive).toContain('Content arrangement ONLY');
    expect(directive).toContain('NO hex colors');
    expect(directive).toContain('NO px values');
    expect(directive).toContain('NO font-family');
    expect(directive).toContain('test-pkg');
    expect(directive).toContain('.card');
  });

  it('blocks violations with severity=block (AC3 integration)', () => {
    const html = '<div style="color: #abcdef; margin: 30px; font-size: 22px">triple violation</div>';
    const violations = enforcer.enforce(html, minimalPackage);
    const blocks = violations.filter(v => v.severity === 'block');
    expect(blocks.length).toBeGreaterThanOrEqual(3);
  });
});

// ============================================================
// FR-G03 AC3: ReferencePageMatcher — auto-match by task type
// ============================================================
describe('ReferencePageMatcher (FR-G03 AC3)', () => {
  const matcher = new ReferencePageMatcher();

  it('falls back to package default reference when no task-specific ref', () => {
    const ref = matcher.resolve(minimalPackage, 'slides');
    expect(ref).toBe(minimalPackage.reference);
  });

  it('returns user-specified reference with highest priority', () => {
    const userRef = { html: '<div>user custom</div>' };
    const ref = matcher.resolve(minimalPackage, 'slides', userRef);
    expect(ref).toBe(userRef);
  });

  it('returns task-specific reference when registered', () => {
    const slidesRef = { html: '<div>slides reference</div>' };
    matcher.registerReference('test-pkg', 'slides', slidesRef);
    const ref = matcher.resolve(minimalPackage, 'slides');
    expect(ref).toBe(slidesRef);
  });

  it('user-specified overrides task-specific', () => {
    const slidesRef = { html: '<div>slides reference</div>' };
    const userRef = { html: '<div>user override</div>' };
    matcher.registerReference('test-pkg', 'poster', slidesRef);
    const ref = matcher.resolve(minimalPackage, 'poster', userRef);
    expect(ref).toBe(userRef);
  });

  it('different task types get different references', () => {
    const m = new ReferencePageMatcher();
    const chartRef = { html: '<div>chart ref</div>' };
    const dashRef = { html: '<div>dashboard ref</div>' };
    m.registerReference('test-pkg', 'chart', chartRef);
    m.registerReference('test-pkg', 'dashboard', dashRef);
    expect(m.resolve(minimalPackage, 'chart')).toBe(chartRef);
    expect(m.resolve(minimalPackage, 'dashboard')).toBe(dashRef);
  });

  it('listReferences returns all registered entries', () => {
    const m = new ReferencePageMatcher();
    m.registerReference('test-pkg', 'chart', { html: '<div>chart</div>' });
    m.registerReference('test-pkg', 'poster', { html: '<div>poster</div>' });
    const list = m.listReferences('test-pkg');
    expect(list).toHaveLength(2);
    expect(list.map(e => e.taskType).sort()).toEqual(['chart', 'poster']);
  });

  it('hasReference checks existence', () => {
    const m = new ReferencePageMatcher();
    m.registerReference('test-pkg', 'landing', { html: '<div>landing</div>' });
    expect(m.hasReference('test-pkg', 'landing')).toBe(true);
    expect(m.hasReference('test-pkg', 'flowchart')).toBe(false);
    expect(m.hasReference('other-pkg', 'landing')).toBe(false);
  });

  it('listReferences returns empty for unknown package', () => {
    const m = new ReferencePageMatcher();
    expect(m.listReferences('nonexistent')).toHaveLength(0);
  });
});
