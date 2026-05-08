import { describe, expect, it } from 'vitest';
import { DesignSystemRegistry } from '../../src/design-system/registry.js';
import { HardcodedValueDetector } from '../../src/design-system/constraint-checker.js';
import { ConstraintInjector, MAX_RETRY_ATTEMPTS } from '../../src/design-system/constraint-injector.js';
import { VisualVerifier } from '../../src/design-system/visual-verifier.js';
import { DARK_SCI_FI_PACKAGE } from '../../src/design-system/packages/dark-sci-fi.js';
import type { DesignSystemPackage } from '../../src/design-system/types.js';

const minimalPackage: DesignSystemPackage = {
  id: 'test-pkg',
  name: 'Test Package',
  version: '1.0.0',
  tokens: {
    colors: { 'primary': '#ff0000', 'bg': '#000000' },
    spacing: { unit: '8px', values: { sm: '8px', md: '16px', lg: '24px' } },
    typography: {
      fontFamily: { heading: 'Inter', body: 'Inter' },
      sizes: { sm: '12px', md: '16px', lg: '24px' },
      weights: { normal: '400', bold: '700' },
      lineHeights: { normal: '1.5' },
    },
    radius: { sm: '4px', md: '8px' },
    shadows: { card: '0 2px 4px rgba(0,0,0,.1)' },
    opacity: { light: '0.1' },
  },
  components: [
    { name: 'card', selector: 'card', properties: { border: '1px solid var(--line)' } },
  ],
  reference: { html: '<div class="card">Reference</div>' },
  constraints: { enforce: [], forbid: [] },
};

describe('DesignSystemRegistry (FR-G01)', () => {
  it('registers and retrieves packages', () => {
    const registry = new DesignSystemRegistry();
    registry.register(minimalPackage);
    expect(registry.has('test-pkg')).toBe(true);
    expect(registry.get('test-pkg')).toBe(minimalPackage);
  });

  it('first registered package becomes default', () => {
    const registry = new DesignSystemRegistry();
    registry.register(minimalPackage);
    expect(registry.getDefault()).toBe(minimalPackage);
  });

  it('supports multiple packages (AC3)', () => {
    const registry = new DesignSystemRegistry();
    registry.register(minimalPackage);
    registry.register(DARK_SCI_FI_PACKAGE);
    expect(registry.list()).toHaveLength(2);
  });

  it('resolve throws on missing package', () => {
    const registry = new DesignSystemRegistry();
    expect(() => registry.resolve('nonexistent')).toThrow();
  });

  it('setDefault changes active package', () => {
    const registry = new DesignSystemRegistry();
    registry.register(minimalPackage);
    registry.register(DARK_SCI_FI_PACKAGE);
    registry.setDefault('dark-sci-fi');
    expect(registry.getDefault()?.id).toBe('dark-sci-fi');
  });
});

describe('HardcodedValueDetector (FR-G02)', () => {
  const detector = new HardcodedValueDetector();

  it('detects hardcoded hex colors in inline styles (AC1)', () => {
    const html = '<div style="color: #ff5500; background: var(--bg)">test</div>';
    const violations = detector.detect(html, minimalPackage);
    expect(violations.some(v => v.ruleId === 'no-hardcoded-color')).toBe(true);
  });

  it('allows colors that match package tokens', () => {
    const html = '<div style="color: #ff0000">test</div>';
    const violations = detector.detect(html, minimalPackage);
    expect(violations.filter(v => v.ruleId === 'no-hardcoded-color')).toHaveLength(0);
  });

  it('detects hardcoded px spacing', () => {
    const html = '<div style="margin: 13px">test</div>';
    const violations = detector.detect(html, minimalPackage);
    expect(violations.some(v => v.ruleId === 'no-hardcoded-spacing')).toBe(true);
  });

  it('detects hardcoded font-size', () => {
    const html = '<style>.title { font-size: 18px }</style>';
    const violations = detector.detect(html, minimalPackage);
    expect(violations.some(v => v.ruleId === 'no-hardcoded-font-size')).toBe(true);
  });

  it('passes clean HTML using only variables', () => {
    const html = '<div style="color: var(--primary); padding: var(--spacing-md)">ok</div>';
    const violations = detector.detect(html, minimalPackage);
    expect(violations).toHaveLength(0);
  });
});

describe('ConstraintInjector (FR-G04)', () => {
  const injector = new ConstraintInjector();

  it('builds prompt block with enforce and forbid rules (AC1, AC2)', () => {
    const block = injector.buildPromptBlock(minimalPackage);
    expect(block.enforceRules.length).toBeGreaterThan(0);
    expect(block.forbidRules.length).toBeGreaterThan(0);
    expect(block.availableTokens).toContain('--primary');
    expect(block.availableClasses).toContain('card');
  });

  it('formats constraint block for LLM prompt (AC2)', () => {
    const block = injector.buildPromptBlock(minimalPackage);
    const formatted = injector.formatForPrompt(block);
    expect(formatted).toContain('DESIGN SYSTEM CONSTRAINTS');
    expect(formatted).toContain('ENFORCE');
    expect(formatted).toContain('FORBID');
    expect(formatted).toContain('NEVER');
  });

  it('validates HTML and returns violations', () => {
    const violations = injector.validate(
      '<div style="color: #abcdef">bad</div>',
      minimalPackage,
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  it('shouldRetry returns true when violations exist and attempts remain (AC3)', () => {
    expect(injector.shouldRetry({
      attempt: 1,
      maxAttempts: MAX_RETRY_ATTEMPTS,
      violations: [{ ruleId: 'test', message: 'fail', severity: 'block' }],
      html: '',
    })).toBe(true);
  });

  it('shouldRetry returns false when max attempts reached', () => {
    expect(injector.shouldRetry({
      attempt: 3,
      maxAttempts: MAX_RETRY_ATTEMPTS,
      violations: [{ ruleId: 'test', message: 'fail', severity: 'block' }],
      html: '',
    })).toBe(false);
  });
});

describe('VisualVerifier (FR-G05)', () => {
  it('skips verification when no provider configured', async () => {
    const verifier = new VisualVerifier();
    const result = await verifier.verify('<div>test</div>', minimalPackage);
    expect(result.passed).toBe(true);
    expect(result.details).toContain('skipped');
  });

  it('compares screenshots when provider available (AC1, AC2)', async () => {
    const mockBuffer = Buffer.from('fake-image');
    const verifier = new VisualVerifier({
      threshold: 10,
      screenshotProvider: { capture: async () => mockBuffer },
      imageComparator: { compare: async () => ({ deviationPercent: 5 }) },
    });
    const pkgWithRef = { ...minimalPackage, reference: { html: '<div>reference</div>' } };

    const result = await verifier.verify('<div>test</div>', pkgWithRef);
    expect(result.passed).toBe(true);
    expect(result.deviationPercent).toBe(5);
  });

  it('fails when deviation exceeds threshold (AC2)', async () => {
    const mockBuffer = Buffer.from('fake-image');
    const verifier = new VisualVerifier({
      threshold: 10,
      screenshotProvider: { capture: async () => mockBuffer },
      imageComparator: { compare: async () => ({ deviationPercent: 25 }) },
    });
    const pkgWithRef = { ...minimalPackage, reference: { html: '<div>reference</div>' } };

    const result = await verifier.verify('<div>test</div>', pkgWithRef);
    expect(result.passed).toBe(false);
    expect(result.deviationPercent).toBe(25);
  });
});

describe('DARK_SCI_FI_PACKAGE (FR-G03)', () => {
  it('has complete token definitions (AC1)', () => {
    expect(Object.keys(DARK_SCI_FI_PACKAGE.tokens.colors).length).toBeGreaterThan(5);
    expect(Object.keys(DARK_SCI_FI_PACKAGE.tokens.spacing.values).length).toBeGreaterThan(3);
    expect(Object.keys(DARK_SCI_FI_PACKAGE.tokens.typography.sizes).length).toBeGreaterThan(3);
  });

  it('has component class definitions', () => {
    expect(DARK_SCI_FI_PACKAGE.components.length).toBeGreaterThan(0);
    expect(DARK_SCI_FI_PACKAGE.components.some(c => c.name === 'card')).toBe(true);
  });

  it('has reference page with real HTML (AC1)', () => {
    expect(DARK_SCI_FI_PACKAGE.reference.html).toContain('<!DOCTYPE html>');
    expect(DARK_SCI_FI_PACKAGE.reference.html).toContain('--accent-a');
    expect(DARK_SCI_FI_PACKAGE.reference.html).toContain('card');
  });

  it('has enforce constraint rules', () => {
    expect(DARK_SCI_FI_PACKAGE.constraints.enforce.length).toBeGreaterThan(0);
  });

  it('has forbid constraint rules', () => {
    expect(DARK_SCI_FI_PACKAGE.constraints.forbid.length).toBeGreaterThan(0);
  });

  it('enforce rules detect out-of-palette colors', () => {
    const colorRule = DARK_SCI_FI_PACKAGE.constraints.enforce.find(r => r.id === 'color-palette-limit');
    expect(colorRule).toBeDefined();
    const violation = colorRule!.check('<div style="color: #abcdef">bad</div>', DARK_SCI_FI_PACKAGE);
    expect(violation).not.toBeNull();
    expect(violation!.ruleId).toBe('color-palette-limit');
  });

  it('enforce rules pass for palette colors', () => {
    const colorRule = DARK_SCI_FI_PACKAGE.constraints.enforce.find(r => r.id === 'color-palette-limit');
    const violation = colorRule!.check('<div style="color: #ec4899">ok</div>', DARK_SCI_FI_PACKAGE);
    expect(violation).toBeNull();
  });

  it('forbid rules detect rgb/hsl functions', () => {
    const rgbRule = DARK_SCI_FI_PACKAGE.constraints.forbid.find(r => r.id === 'no-rgb-hsl-colors');
    expect(rgbRule).toBeDefined();
    const violation = rgbRule!.check('<div style="color: rgb(255, 0, 0)">bad</div>', DARK_SCI_FI_PACKAGE);
    expect(violation).not.toBeNull();
  });

  it('forbid rules detect external fonts', () => {
    const fontRule = DARK_SCI_FI_PACKAGE.constraints.forbid.find(r => r.id === 'no-external-fonts');
    expect(fontRule).toBeDefined();
    const violation = fontRule!.check('<style>body { font-family: "Comic Sans MS" }</style>', DARK_SCI_FI_PACKAGE);
    expect(violation).not.toBeNull();
  });
});

describe('ConstraintInjector.generateWithRetry (FR-G04 AC3 + FR-G05)', () => {
  const injector = new ConstraintInjector();

  it('accepts clean HTML on first attempt', async () => {
    const cleanHtml = '<div style="color: var(--primary); padding: var(--spacing-md)">ok</div>';
    const result = await injector.generateWithRetry(
      minimalPackage,
      async () => cleanHtml,
    );
    expect(result.attempts).toHaveLength(1);
    expect(result.html).toBe(cleanHtml);
  });

  it('retries on constraint violations up to MAX_RETRY_ATTEMPTS', async () => {
    let callCount = 0;
    const result = await injector.generateWithRetry(
      minimalPackage,
      async () => {
        callCount++;
        return '<div style="color: #abcdef">always bad</div>';
      },
    );
    expect(callCount).toBe(MAX_RETRY_ATTEMPTS);
    expect(result.attempts).toHaveLength(MAX_RETRY_ATTEMPTS);
    expect(result.attempts[0].violations.length).toBeGreaterThan(0);
  });

  it('succeeds after retry when second attempt is clean', async () => {
    let callCount = 0;
    const result = await injector.generateWithRetry(
      minimalPackage,
      async () => {
        callCount++;
        if (callCount === 1) return '<div style="color: #abcdef">bad</div>';
        return '<div style="color: var(--primary)">fixed</div>';
      },
    );
    expect(callCount).toBe(2);
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts[1].violations).toHaveLength(0);
  });

  it('passes previous violations to generator for correction', async () => {
    let receivedViolations: unknown;
    let callCount = 0;
    await injector.generateWithRetry(
      minimalPackage,
      async (_prompt, violations) => {
        callCount++;
        receivedViolations = violations;
        if (callCount === 1) return '<div style="color: #abcdef">bad</div>';
        return '<div style="color: var(--primary)">fixed</div>';
      },
    );
    expect(receivedViolations).toBeDefined();
    expect(Array.isArray(receivedViolations)).toBe(true);
  });

  it('retries on visual deviation (FR-G05 AC2)', async () => {
    let callCount = 0;
    const pkgWithRef = { ...minimalPackage, reference: { html: '<div>reference</div>' } };
    const result = await injector.generateWithRetry(
      pkgWithRef,
      async () => {
        callCount++;
        return '<div style="color: var(--primary)">clean</div>';
      },
      {
        threshold: 10,
        screenshotProvider: { capture: async () => Buffer.from('img') },
        imageComparator: {
          compare: async () => ({ deviationPercent: callCount === 1 ? 20 : 5 }),
        },
      },
    );
    expect(callCount).toBe(2);
    expect(result.visualResult?.passed).toBe(true);
  });
});
