import { describe, expect, it } from 'vitest';
import { QualityGateL1 } from '../../src/quality/quality-gate.js';
import { QualityGateL2Impl, QualityGateL2Stub } from '../../src/quality/quality-gate-l2.js';
import { QualityGateL3Impl, QualityGateL3Stub } from '../../src/quality/quality-gate-l3.js';
import type { Artifact } from '../../src/types.js';

function makeArtifact(overrides: Partial<Artifact> = {}): Artifact {
  return {
    taskId: 'task-quality',
    type: 'slides',
    status: 'ready',
    pages: 2,
    metadata: {},
    html: `<!DOCTYPE html>
<html>
<head>
  <title>AI Strategy Review</title>
  <style>:root { --cd-color-primary: #123456; } .card { color: var(--cd-color-primary); }</style>
</head>
<body style="font-family:'Noto Sans SC'">
  <section><h1>AI Strategy Review</h1><p>AI strategy focuses on model adoption and business review.</p></section>
  <section><h2>Execution</h2><p>Execution roadmap and AI governance actions.</p></section>
</body>
</html>`,
    ...overrides,
  };
}

describe('Quality gates', () => {
  it('L1 passes a well-formed artifact', () => {
    const report = new QualityGateL1().check(makeArtifact());

    expect(report.conclusion).toBe('pass');
    expect(report.items.every(item => item.passed)).toBe(true);
  });

  it('L1 blocks empty HTML content', () => {
    const report = new QualityGateL1().check(makeArtifact({ html: '', pages: 1 }));

    expect(report.conclusion).toBe('block');
    expect(report.items.find(item => item.rule === 'html-non-empty')?.passed).toBe(false);
  });

  it('L1 blocks placeholder residue', () => {
    const report = new QualityGateL1().check(
      makeArtifact({ html: makeArtifact().html.replace('Execution roadmap', 'TODO roadmap') }),
    );

    expect(report.conclusion).toBe('block');
    expect(report.items.find(item => item.rule === 'no-placeholders')?.message).toContain('TODO');
  });

  it('L1 warns when no CJK font is declared', () => {
    const html = makeArtifact().html.replace("font-family:'Noto Sans SC'", "font-family:'Arial'");
    const report = new QualityGateL1().check(makeArtifact({ html }));

    expect(report.conclusion).toBe('warn');
    expect(report.items.find(item => item.rule === 'cjk-font')).toMatchObject({ passed: false, severity: 'warn' });
  });

  it('L1 blocks empty sections and oversized section content', () => {
    const hugeText = '内容'.repeat(1200);
    const html = `<!DOCTYPE html><html><body>
      <section><h1>标题</h1><p>${hugeText}</p></section>
      <section>   </section>
    </body></html>`;
    const report = new QualityGateL1().check(makeArtifact({ html }));

    expect(report.conclusion).toBe('block');
    expect(report.items.find(item => item.rule === 'content-density')?.passed).toBe(false);
    expect(report.items.find(item => item.rule === 'no-empty-sections')?.passed).toBe(false);
  });

  it('L2 warns when no title metadata is available for semantic checks', async () => {
    const artifact = makeArtifact({
      html: `<!DOCTYPE html><html><head></head>
      <body><section><p>Quarterly sales pipeline revenue review.</p></section></body></html>`,
    });

    const report = await new QualityGateL2Impl().check(artifact);

    expect(report.conclusion).toBe('warn');
    expect(report.items.find(item => item.rule === 'semantic-coherence')).toMatchObject({ passed: false, severity: 'warn' });
  });

  it('L2 blocks when body text content is missing', async () => {
    const artifact = makeArtifact({
      html: '<html><body><section><div></div></section></body></html>',
    });

    const report = await new QualityGateL2Impl().check(artifact);

    expect(report.conclusion).toBe('block');
    expect(report.items.find(item => item.rule === 'structural-body-content')).toMatchObject({ passed: false, severity: 'block' });
  });

  it('L2 warns when slides do not have enough sections', async () => {
    const artifact = makeArtifact({
      html: `<!DOCTYPE html><html><head><title>Roadmap</title><style>.x{color:var(--cd-color-primary)}</style></head>
      <body><section><h1>Roadmap</h1><p>Roadmap roadmap roadmap.</p></section></body></html>`,
    });

    const report = await new QualityGateL2Impl().check(artifact);

    expect(report.conclusion).toBe('warn');
    expect(report.items.find(item => item.rule === 'structural-slides-sections')?.passed).toBe(false);
  });

  it('L2 passes non-slide artifacts without section tags when body content exists', async () => {
    const artifact = makeArtifact({
      type: 'chart',
      html: '<html><head><title>Revenue Chart</title><style>.x{fill:var(--cd-color-primary)}</style></head><body>Revenue chart revenue chart</body></html>',
    });

    const report = await new QualityGateL2Impl().check(artifact);

    expect(report.conclusion).toBe('pass');
    expect(report.items.find(item => item.rule === 'structural-sections')?.passed).toBe(true);
  });

  it('L2 reports baseline style when no Brand Kit is provided', async () => {
    const artifact = makeArtifact();
    artifact.metadata.qualityContext = {
      theme: {
        baselineLabel: 'Claw Baseline',
      },
    };

    const report = await new QualityGateL2Impl().check(artifact);

    expect(report.items.find(item => item.rule === 'brand-compliance-baseline')?.message).toContain('Claw Baseline');
  });

  it('L2 flags missing brand markers and text-dense anti-patterns', async () => {
    const artifact = makeArtifact({
      html: `<!DOCTYPE html><html><head><title>Brand Deck</title><style>.x{color:var(--cd-color-primary)}</style></head><body>
      <section><h1>Brand Deck</h1><p>${'内容'.repeat(950)}</p></section>
      </body></html>`,
      pages: 1,
      metadata: {
        qualityContext: {
          theme: {
            colorPrimary: '#112233',
            fontHeading: 'Brand Sans',
            fontBody: 'Brand Sans',
            brandKit: {
              colors: ['#112233'],
              fonts: ['Brand Sans'],
              logo: { required: true },
            },
          },
        },
      },
    });

    const report = await new QualityGateL2Impl().check(artifact);

    expect(report.conclusion).toBe('block');
    expect(report.items.find(item => item.rule === 'brand-compliance-logo')?.passed).toBe(false);
    expect(report.items.find(item => item.rule === 'anti-pattern-text-density')?.passed).toBe(false);
  });

  it('L2 allows waived anti-patterns to downgrade to warnings', async () => {
    const artifact = makeArtifact({
      html: `<!DOCTYPE html><html><head><title>Roadmap</title><style>.x{color:var(--cd-color-primary)}</style></head><body>
      <section><h1>Roadmap</h1><h3>Skipped Level</h3><p>Roadmap details.</p></section>
      </body></html>`,
      metadata: {
        qualityContext: {
          allowStyleExceptions: ['anti-pattern-hierarchy-chaos'],
        },
      },
    });

    const report = await new QualityGateL2Impl().check(artifact);

    expect(report.items.find(item => item.rule === 'anti-pattern-hierarchy-chaos')?.severity).toBe('warn');
  });

  it('L2 stub delegates to the real implementation', async () => {
    const artifact = makeArtifact({
      html: '<html><head><title>Topic</title></head><body><section><h1>Topic</h1><p>Different body words only.</p></section></body></html>',
    });

    const report = await new QualityGateL2Stub().check(artifact);

    expect(report.items.some(item => item.rule === 'semantic-coherence')).toBe(true);
  });

  it('L3 stub always returns a passing visual check', async () => {
    const report = await new QualityGateL3Stub().check(makeArtifact());

    expect(report.conclusion).toBe('pass');
    expect(report.items).toEqual([
      {
        rule: 'visual-rendering',
        passed: true,
        severity: 'info',
        message: 'L3 visual check stub — not yet implemented',
      },
    ]);
  });

  it('L3 runs visual checks and passes well-formed artifact', async () => {
    const report = await new QualityGateL3Impl().check(makeArtifact(), {
      requestInput: 'Create an AI strategy review deck',
    });

    // Visual checks run, semantic validation stays disabled
    expect(report.items.length).toBeGreaterThan(0);
    expect(report.items.some(i => i.rule.startsWith('visual-'))).toBe(true);
    expect(report.items.find(i => i.rule === 'semantic-cross-validation')).toBeUndefined();
    expect(report.conclusion).toBe('pass');
  });

  it('L3 detects font hierarchy violation', async () => {
    const html = `<!DOCTYPE html><html><head><style>
      h1 { font-size: 14px; }
      p { font-size: 16px; }
    </style></head><body>
      <section><h1>Title</h1><p>Body text here.</p></section>
    </body></html>`;
    const report = await new QualityGateL3Impl().check(makeArtifact({ html }));

    const hierarchyItem = report.items.find(i => i.rule === 'visual-font-hierarchy');
    expect(hierarchyItem?.passed).toBe(false);
    expect(report.conclusion).toBe('warn');
  });

  it('L3 detects low color contrast', async () => {
    const html = `<!DOCTYPE html><html><body>
      <p style="color: #eeeeee; background-color: #ffffff">Hard to read</p>
    </body></html>`;
    const report = await new QualityGateL3Impl().check(makeArtifact({ html }));

    const contrastItem = report.items.find(i => i.rule === 'visual-color-contrast');
    expect(contrastItem?.passed).toBe(false);
  });

  it('L3 detects missing whitespace declarations', async () => {
    const html = `<!DOCTYPE html><html><body>
      <section><h1>A</h1></section>
      <section><h1>B</h1></section>
      <section><h1>C</h1></section>
    </body></html>`;
    const report = await new QualityGateL3Impl().check(makeArtifact({ html }));

    const wsItem = report.items.find(i => i.rule === 'visual-whitespace');
    expect(wsItem?.passed).toBe(false);
  });

  it('L3 detects mixed alignment', async () => {
    const html = `<!DOCTYPE html><html><body>
      <div style="text-align: left">Left</div>
      <div style="text-align: center">Center</div>
      <div style="text-align: right">Right</div>
    </body></html>`;
    const report = await new QualityGateL3Impl().check(makeArtifact({ html }));

    const alignItem = report.items.find(i => i.rule === 'visual-alignment');
    expect(alignItem?.passed).toBe(false);
  });

  it('L3 blocks overcrowded pages', async () => {
    const sections = Array.from({ length: 10 }, (_, i) => `<section><h2>S${i}</h2></section>`).join('');
    const html = `<!DOCTYPE html><html><body>${sections}</body></html>`;
    const report = await new QualityGateL3Impl().check(makeArtifact({ html, pages: 1 }));

    const densityItem = report.items.find(i => i.rule === 'visual-page-density');
    expect(densityItem?.passed).toBe(false);
    expect(densityItem?.severity).toBe('block');
    expect(report.conclusion).toBe('block');
  });

  it('L3 detects tiny font sizes', async () => {
    const html = `<!DOCTYPE html><html><head><style>
      small { font-size: 6px; }
    </style></head><body><small>Tiny</small></body></html>`;
    const report = await new QualityGateL3Impl().check(makeArtifact({ html }));

    const sizeItem = report.items.find(i => i.rule === 'visual-min-font-size');
    expect(sizeItem?.passed).toBe(false);
  });

  it('L3 semantic validation warns when cost acknowledgement is missing', async () => {
    const report = await new QualityGateL3Impl().check(makeArtifact(), {
      requestInput: 'Create an AI strategy review deck',
      semanticValidation: { enabled: true, userAcknowledgedCost: false },
    });

    expect(report.conclusion).toBe('warn');
    expect(report.items.find(item => item.rule === 'semantic-cross-validation')?.message).toContain('cost/latency acknowledgement');
  });

  it('L3 semantic validation passes when enabled and acknowledged on well-formed artifact', async () => {
    const report = await new QualityGateL3Impl().check(makeArtifact(), {
      requestInput: 'AI strategy review deck',
      semanticValidation: { enabled: true, userAcknowledgedCost: true },
    });

    expect(report.items.find(item => item.rule === 'semantic-cross-validation')?.passed).toBe(true);
    // Visual checks also run but pass on well-formed artifact
    expect(report.items.some(i => i.rule.startsWith('visual-'))).toBe(true);
  });
});
