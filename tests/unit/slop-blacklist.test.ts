import { describe, expect, it } from 'vitest';
import { BUILTIN_SLOP_RULES } from '../../src/quality/slop-blacklist.js';
import type { SlopRule } from '../../src/quality/slop-blacklist.js';
import { SlopConfigManager } from '../../src/quality/slop-config.js';
import { SlopChecker } from '../../src/quality/slop-checker.js';

// ── FR-D09: Slop Blacklist Rules ──

describe('FR-D09: Slop Blacklist', () => {
  it('AC1: has at least 20 built-in rules with required fields', () => {
    expect(BUILTIN_SLOP_RULES.length).toBeGreaterThanOrEqual(20);
    for (const rule of BUILTIN_SLOP_RULES) {
      expect(rule.id).toMatch(/^[a-z][a-z0-9-]+$/); // kebab-case
      expect(rule.name).toBeTruthy();
      expect(rule.description).toBeTruthy();
      expect(rule.detection).toBeTruthy();
      expect(['block', 'warn']).toContain(rule.severity);
      expect(typeof rule.detect).toBe('function');
    }
  });

  it('AC1: all rule IDs are unique', () => {
    const ids = BUILTIN_SLOP_RULES.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // ── Per-rule positive/negative tests (AC2) ──

  describe('generic-purple-gradient', () => {
    const rule = getRule('generic-purple-gradient');

    it('triggers on purple-to-blue gradient background', () => {
      const html = '<div style="background: linear-gradient(135deg, purple, blue);">content</div>';
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger on non-purple gradients', () => {
      const html = '<div style="background: linear-gradient(135deg, #ff6600, #ffcc00);">content</div>';
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('emoji-as-icon', () => {
    const rule = getRule('emoji-as-icon');

    it('triggers on 3+ consecutive emoji', () => {
      const html = '<div>🚀🎯💡🔥 Features</div>';
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger on 1-2 emoji', () => {
      const html = '<div>🚀 Launch</div>';
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('inter-as-display', () => {
    const rule = getRule('inter-as-display');

    it('triggers on Inter in heading inline style', () => {
      const html = '<h1 style="font-family: Inter, sans-serif;">Title</h1>';
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger on Inter in body text', () => {
      const html = '<p style="font-family: Inter, sans-serif;">Body text</p>';
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('hand-drawn-faces', () => {
    const rule = getRule('hand-drawn-faces');

    it('triggers on SVG with avatar class', () => {
      const html = '<svg class="avatar-illustration" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger on generic SVG', () => {
      const html = '<svg class="chart-icon" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('fabricated-data', () => {
    const rule = getRule('fabricated-data');

    it('triggers on "1M+ users" without attribution', () => {
      const html = '<div><span>1M+ users</span><span>99.9% uptime</span></div>';
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger when data-source is present', () => {
      const html = '<div data-source="internal-metrics"><span>1M+ users</span></div>';
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('stock-photo-description', () => {
    const rule = getRule('stock-photo-description');

    it('triggers on stock photo alt text', () => {
      const html = '<img alt="happy diverse team in modern office" src="team.jpg">';
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger on specific alt text', () => {
      const html = '<img alt="Q3 revenue chart showing 23% growth" src="chart.png">';
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('lorem-ipsum', () => {
    const rule = getRule('lorem-ipsum');

    it('triggers on Lorem ipsum text', () => {
      const html = '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>';
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger on real content', () => {
      const html = '<p>Our platform helps teams collaborate more effectively.</p>';
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('excessive-drop-shadow', () => {
    const rule = getRule('excessive-drop-shadow');

    it('triggers when 4+ elements share identical shadow', () => {
      const html = `
        <div style="box-shadow: 0 4px 6px rgba(0,0,0,0.1);">A</div>
        <div style="box-shadow: 0 4px 6px rgba(0,0,0,0.1);">B</div>
        <div style="box-shadow: 0 4px 6px rgba(0,0,0,0.1);">C</div>
        <div style="box-shadow: 0 4px 6px rgba(0,0,0,0.1);">D</div>
      `;
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger with varied shadows', () => {
      const html = `
        <div style="box-shadow: 0 4px 6px rgba(0,0,0,0.1);">A</div>
        <div style="box-shadow: 0 2px 4px rgba(0,0,0,0.2);">B</div>
        <div style="box-shadow: 0 8px 16px rgba(0,0,0,0.05);">C</div>
      `;
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('all-pill-buttons', () => {
    const rule = getRule('all-pill-buttons');

    it('triggers when all buttons are pill-shaped', () => {
      const html = `
        <button style="border-radius: 9999px;">Sign Up</button>
        <button style="border-radius: 9999px;">Learn More</button>
        <button style="border-radius: 9999px;">Contact</button>
      `;
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger with mixed border-radius', () => {
      const html = `
        <button style="border-radius: 9999px;">Sign Up</button>
        <button style="border-radius: 8px;">Learn More</button>
      `;
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('uniform-card-grid', () => {
    const rule = getRule('uniform-card-grid');

    it('triggers on 4+ identical cards', () => {
      const html = `
        <div class="feature-card">A</div>
        <div class="feature-card">B</div>
        <div class="feature-card">C</div>
        <div class="feature-card">D</div>
      `;
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger with varied card classes', () => {
      const html = `
        <div class="feature-card large">A</div>
        <div class="feature-card">B</div>
        <div class="feature-card highlighted">C</div>
        <div class="feature-card">D</div>
      `;
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('glassmorphism-overuse', () => {
    const rule = getRule('glassmorphism-overuse');

    it('triggers when 3+ elements use backdrop-filter blur', () => {
      const html = `
        <div style="backdrop-filter: blur(10px);">A</div>
        <div style="backdrop-filter: blur(10px);">B</div>
        <div style="backdrop-filter: blur(10px);">C</div>
      `;
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger with 2 or fewer', () => {
      const html = `
        <div style="backdrop-filter: blur(10px);">A</div>
        <div style="backdrop-filter: blur(10px);">B</div>
      `;
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('generic-gradient-blob', () => {
    const rule = getRule('generic-gradient-blob');

    it('triggers on blob-class decorative elements', () => {
      const html = '<div class="blob decoration" style="position: absolute;"></div>';
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger on normal positioned elements', () => {
      const html = '<div class="content-section" style="position: relative;">Real content</div>';
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('centered-everything', () => {
    const rule = getRule('centered-everything');

    it('triggers when 5+ center alignments and no other alignment', () => {
      const html = `
        <div style="text-align: center;">A</div>
        <div style="text-align: center;">B</div>
        <div style="text-align: center;">C</div>
        <div style="text-align: center;">D</div>
        <div style="text-align: center;">E</div>
      `;
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger when mixed alignments exist', () => {
      const html = `
        <div style="text-align: center;">A</div>
        <div style="text-align: center;">B</div>
        <div style="text-align: center;">C</div>
        <div style="text-align: center;">D</div>
        <div style="text-align: center;">E</div>
        <div style="text-align: left;">F</div>
      `;
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('generic-isometric-illustration', () => {
    const rule = getRule('generic-isometric-illustration');

    it('triggers on isometric class/alt references', () => {
      const html = '<img class="isometric-hero" alt="isometric illustration" src="hero.svg">';
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger on non-isometric images', () => {
      const html = '<img class="hero-image" alt="product screenshot" src="hero.png">';
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('excessive-border-radius', () => {
    const rule = getRule('excessive-border-radius');

    it('triggers when 5+ elements use >= 16px radius with no smaller', () => {
      const html = `
        <div style="border-radius: 20px;">A</div>
        <div style="border-radius: 20px;">B</div>
        <div style="border-radius: 24px;">C</div>
        <div style="border-radius: 16px;">D</div>
        <div style="border-radius: 20px;">E</div>
      `;
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger when smaller radii exist', () => {
      const html = `
        <div style="border-radius: 20px;">A</div>
        <div style="border-radius: 20px;">B</div>
        <div style="border-radius: 20px;">C</div>
        <div style="border-radius: 20px;">D</div>
        <div style="border-radius: 20px;">E</div>
        <div style="border-radius: 4px;">F</div>
      `;
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('dark-neon-combo', () => {
    const rule = getRule('dark-neon-combo');

    it('triggers on dark bg + neon text', () => {
      const html = '<div style="background-color: #111; color: #0ff;">Neon text</div>';
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger on light backgrounds', () => {
      const html = '<div style="background-color: #fff; color: #333;">Normal text</div>';
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('generic-hero-layout', () => {
    const rule = getRule('generic-hero-layout');

    it('triggers on generic centered hero with h1 + subtitle + CTA', () => {
      const html = `
        <section class="hero" style="text-align: center;">
          <h1>Welcome to Our Platform</h1>
          <p class="subtitle">The best solution for your needs</p>
          <a class="btn cta" href="#">Get Started</a>
        </section>
      `;
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger on non-hero sections', () => {
      const html = `
        <section class="features">
          <h2>Features</h2>
          <div class="grid"><div>Feature 1</div><div>Feature 2</div></div>
        </section>
      `;
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('gradient-text-overuse', () => {
    const rule = getRule('gradient-text-overuse');

    it('triggers when 3+ elements use background-clip: text', () => {
      const html = `
        <style>
          .grad1 { -webkit-background-clip: text; }
          .grad2 { -webkit-background-clip: text; }
          .grad3 { background-clip: text; }
        </style>
      `;
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger with 2 or fewer', () => {
      const html = `
        <style>
          .grad1 { -webkit-background-clip: text; }
          .grad2 { background-clip: text; }
        </style>
      `;
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('generic-testimonial-cards', () => {
    const rule = getRule('generic-testimonial-cards');

    it('triggers on 3+ identical testimonial cards', () => {
      const html = `
        <div class="testimonial-card"><img src="a.jpg"><blockquote>Great!</blockquote><span>Alice</span></div>
        <div class="testimonial-card"><img src="b.jpg"><blockquote>Amazing!</blockquote><span>Bob</span></div>
        <div class="testimonial-card"><img src="c.jpg"><blockquote>Love it!</blockquote><span>Carol</span></div>
      `;
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger with fewer than 3', () => {
      const html = `
        <div class="testimonial-card"><blockquote>Great!</blockquote></div>
        <div class="testimonial-card"><blockquote>Amazing!</blockquote></div>
      `;
      expect(rule.detect(html)).toHaveLength(0);
    });
  });

  describe('ai-avatar-placeholder', () => {
    const rule = getRule('ai-avatar-placeholder');

    it('triggers on placeholder avatar service URLs', () => {
      const html = '<img src="https://ui-avatars.com/api/?name=John" class="avatar">';
      expect(rule.detect(html).length).toBeGreaterThan(0);
    });

    it('does not trigger on real image URLs', () => {
      const html = '<img src="/images/team/john-doe.jpg" class="avatar">';
      expect(rule.detect(html)).toHaveLength(0);
    });
  });
});

// ── FR-D10: Slop Configuration ──

describe('FR-D10: Slop Configuration', () => {
  it('AC1: can add custom rules', () => {
    const manager = new SlopConfigManager();
    const result = manager.addCustomRule({
      id: 'custom-no-comic-sans',
      name: 'No Comic Sans',
      description: 'Comic Sans is not allowed',
      detection: 'Check for font-family: Comic Sans',
      severity: 'block',
      detect: (html) => {
        if (/comic\s*sans/i.test(html)) {
          return [{ ruleId: 'custom-no-comic-sans', ruleName: 'No Comic Sans', severity: 'block', message: 'Comic Sans detected' }];
        }
        return [];
      },
    });
    expect(result.success).toBe(true);
    const active = manager.getActiveRules();
    expect(active.some(r => r.id === 'custom-no-comic-sans')).toBe(true);
  });

  it('AC2: can disable built-in rules', () => {
    const manager = new SlopConfigManager({ disabledRules: ['lorem-ipsum'] });
    const active = manager.getActiveRules();
    expect(active.some(r => r.id === 'lorem-ipsum')).toBe(false);
  });

  it('AC2: disableRule method works at runtime', () => {
    const manager = new SlopConfigManager();
    expect(manager.getActiveRules().some(r => r.id === 'lorem-ipsum')).toBe(true);
    manager.disableRule('lorem-ipsum');
    expect(manager.getActiveRules().some(r => r.id === 'lorem-ipsum')).toBe(false);
  });

  it('AC3: can adjust severity', () => {
    const manager = new SlopConfigManager({ severityOverrides: { 'lorem-ipsum': 'warn' } });
    const rule = manager.getActiveRules().find(r => r.id === 'lorem-ipsum');
    expect(rule?.severity).toBe('warn');
  });

  it('AC3: setSeverity method works at runtime', () => {
    const manager = new SlopConfigManager();
    manager.setSeverity('emoji-as-icon', 'warn');
    const rule = manager.getActiveRules().find(r => r.id === 'emoji-as-icon');
    expect(rule?.severity).toBe('warn');
  });

  it('AC4: custom rules execute with same priority as built-in', () => {
    const checker = new SlopChecker({
      config: {
        customRules: [{
          id: 'custom-test',
          name: 'Custom Test',
          description: 'Test rule',
          detection: 'Detect BADWORD',
          severity: 'block',
          detect: (html) => {
            if (html.includes('BADWORD')) {
              return [{ ruleId: 'custom-test', ruleName: 'Custom Test', severity: 'block', message: 'BADWORD found' }];
            }
            return [];
          },
        }],
      },
    });
    const result = checker.check('<div>BADWORD</div>');
    expect(result.passed).toBe(false);
    expect(result.blockers.some(v => v.ruleId === 'custom-test')).toBe(true);
  });

  it('AC5: configuration changes take effect immediately', () => {
    const checker = new SlopChecker();
    const manager = checker.getConfigManager();

    // Initially lorem-ipsum is active
    const result1 = checker.check('<p>Lorem ipsum dolor sit amet</p>');
    expect(result1.blockers.some(v => v.ruleId === 'lorem-ipsum')).toBe(true);

    // Disable it
    manager.disableRule('lorem-ipsum');
    const result2 = checker.check('<p>Lorem ipsum dolor sit amet</p>');
    expect(result2.blockers.some(v => v.ruleId === 'lorem-ipsum')).toBe(false);
  });

  it('AC6: listRules returns all rules with status', () => {
    const manager = new SlopConfigManager({ disabledRules: ['lorem-ipsum'] });
    manager.addCustomRule({
      id: 'custom-rule',
      name: 'Custom',
      description: 'A custom rule',
      detection: 'Custom detection',
      severity: 'warn',
    });
    const list = manager.listRules();
    expect(list.length).toBeGreaterThanOrEqual(21); // 20 built-in + 1 custom

    const loremRule = list.find(r => r.id === 'lorem-ipsum');
    expect(loremRule?.enabled).toBe(false);
    expect(loremRule?.source).toBe('builtin');

    const customRule = list.find(r => r.id === 'custom-rule');
    expect(customRule?.enabled).toBe(true);
    expect(customRule?.source).toBe('custom');
  });

  it('AC7: rejects custom rule with conflicting built-in id', () => {
    const manager = new SlopConfigManager();
    const result = manager.addCustomRule({
      id: 'lorem-ipsum', // conflicts with built-in
      name: 'My Lorem',
      description: 'Duplicate',
      detection: 'Duplicate detection',
      severity: 'block',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('conflicts');
  });

  it('AC7: rejects duplicate custom rule id', () => {
    const manager = new SlopConfigManager();
    manager.addCustomRule({
      id: 'my-rule',
      name: 'My Rule',
      description: 'First',
      detection: 'First detection',
      severity: 'warn',
    });
    const result = manager.addCustomRule({
      id: 'my-rule',
      name: 'My Rule Again',
      description: 'Duplicate',
      detection: 'Duplicate detection',
      severity: 'block',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('enableRule re-enables a disabled rule', () => {
    const manager = new SlopConfigManager({ disabledRules: ['lorem-ipsum'] });
    expect(manager.getActiveRules().some(r => r.id === 'lorem-ipsum')).toBe(false);
    manager.enableRule('lorem-ipsum');
    expect(manager.getActiveRules().some(r => r.id === 'lorem-ipsum')).toBe(true);
  });
});

// ── FR-D11: Slop Check Execution Pipeline ──

describe('FR-D11: Slop Check Pipeline', () => {
  it('AC2: checks all active rules', () => {
    const checker = new SlopChecker();
    const result = checker.check('<div>Clean content</div>');
    expect(result.rulesChecked.length).toBeGreaterThanOrEqual(20);
  });

  it('AC3: block violations cause passed=false', () => {
    const checker = new SlopChecker();
    const html = '<p>Lorem ipsum dolor sit amet</p>';
    const result = checker.check(html);
    expect(result.passed).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
    expect(result.blockers[0].ruleId).toBe('lorem-ipsum');
  });

  it('AC4: warn violations keep passed=true', () => {
    const checker = new SlopChecker({
      config: { severityOverrides: { 'lorem-ipsum': 'warn' } },
    });
    const html = '<p>Lorem ipsum dolor sit amet</p>';
    const result = checker.check(html);
    expect(result.passed).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('AC5: multiple blockers collected in single pass', () => {
    const checker = new SlopChecker();
    const html = `
      <p>Lorem ipsum dolor sit amet</p>
      <div>🚀🎯💡🔥 Icons</div>
    `;
    const result = checker.check(html);
    expect(result.passed).toBe(false);
    expect(result.blockers.length).toBeGreaterThanOrEqual(2);
    const ruleIds = result.blockers.map(b => b.ruleId);
    expect(ruleIds).toContain('lorem-ipsum');
    expect(ruleIds).toContain('emoji-as-icon');
  });

  it('AC7: results include structured violation data', () => {
    const checker = new SlopChecker();
    const html = '<p>Lorem ipsum dolor sit amet</p>';
    const result = checker.check(html);
    expect(result.checkedAt).toBeTruthy();
    expect(result.violations.length).toBeGreaterThan(0);
    const v = result.violations[0];
    expect(v.ruleId).toBeTruthy();
    expect(v.ruleName).toBeTruthy();
    expect(v.severity).toBeTruthy();
    expect(v.message).toBeTruthy();
  });

  it('AC8: exempt rules are downgraded to warn', () => {
    const checker = new SlopChecker({ exemptRules: ['lorem-ipsum'] });
    const html = '<p>Lorem ipsum dolor sit amet</p>';
    const result = checker.check(html);
    expect(result.passed).toBe(true); // Not blocked
    expect(result.warnings.some(w => w.ruleId === 'lorem-ipsum')).toBe(true);
    expect(result.blockers.some(b => b.ruleId === 'lorem-ipsum')).toBe(false);
  });

  it('generateRetryGuidance produces actionable text', () => {
    const checker = new SlopChecker();
    const html = '<p>Lorem ipsum dolor sit amet</p>';
    const result = checker.check(html);
    const guidance = checker.generateRetryGuidance(result.blockers);
    expect(guidance).toContain('lorem-ipsum');
    expect(guidance).toContain('anti-patterns');
    expect(guidance).toContain('avoid');
  });

  it('clean HTML passes all checks', () => {
    const html = `
      <html>
      <head><style>
        body { font-family: 'Helvetica Neue', sans-serif; }
        h1 { font-family: 'Playfair Display', serif; }
        .card { border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card-featured { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      </style></head>
      <body>
        <section class="intro" style="text-align: left;">
          <h1>Product Overview</h1>
          <p>Our solution addresses specific market needs with measurable outcomes.</p>
        </section>
        <section style="text-align: left;">
          <div class="card">Feature A: Detailed description</div>
          <div class="card-featured">Feature B: Highlighted capability</div>
        </section>
      </body>
      </html>
    `;
    const checker = new SlopChecker();
    const result = checker.check(html);
    expect(result.passed).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });
});

// ── Helper ──

function getRule(id: string): SlopRule {
  const rule = BUILTIN_SLOP_RULES.find(r => r.id === id);
  if (!rule) throw new Error(`Rule "${id}" not found`);
  return rule;
}
