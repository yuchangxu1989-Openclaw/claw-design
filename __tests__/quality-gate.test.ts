// Quality Gate L1/L2 unit tests

import { describe, expect, it } from 'vitest';
import { QualityGateL1 } from '../src/quality/quality-gate.ts';
import { QualityGateL2Impl } from '../src/quality/quality-gate-l2.ts';
import type { Artifact } from '../src/types.ts';

const makeArtifact = (overrides: Partial<Artifact> = {}): Artifact => ({
  taskId: 'qg-test-001',
  type: 'slides',
  status: 'ready',
  html: '<html><head></head><body><section><h1>Title</h1><p>Content here</p></section><section><p>Slide 2</p></section></body></html>',
  pages: 2,
  metadata: {},
  ...overrides,
});

// --- L1 Tests ---

describe('QualityGateL1', () => {
  const gate = new QualityGateL1();

  it('passes a valid artifact', () => {
    const artifact = makeArtifact({
      html: '<html><head><style>font-family: "Noto Sans SC";</style></head><body><section><h1>Hello</h1><p>World</p></section></body></html>',
    });
    const report = gate.check(artifact);
    expect(report.conclusion).toBe('pass');
    expect(report.items.every(i => i.passed)).toBe(true);
  });

  it('blocks on empty HTML', () => {
    const artifact = makeArtifact({ html: '' });
    const report = gate.check(artifact);
    expect(report.conclusion).toBe('block');
    expect(report.items.find(i => i.rule === 'html-non-empty')?.passed).toBe(false);
  });

  it('blocks on missing <html>/<body> tags', () => {
    const artifact = makeArtifact({ html: '<div>No structure</div>' });
    const report = gate.check(artifact);
    expect(report.conclusion).toBe('block');
    expect(report.items.find(i => i.rule === 'html-structure')?.passed).toBe(false);
  });

  it('blocks on placeholder content', () => {
    const artifact = makeArtifact({
      html: '<html><body><p>TODO: fill this in</p></body></html>',
    });
    const report = gate.check(artifact);
    expect(report.conclusion).toBe('block');
    expect(report.items.find(i => i.rule === 'no-placeholders')?.passed).toBe(false);
  });

  it('warns on missing CJK font', () => {
    const artifact = makeArtifact({
      html: '<html><head></head><body><section><p>Content</p></section></body></html>',
      pages: 1,
    });
    const report = gate.check(artifact);
    expect(report.items.find(i => i.rule === 'cjk-font')?.passed).toBe(false);
    expect(report.items.find(i => i.rule === 'cjk-font')?.severity).toBe('warn');
  });

  it('blocks on page count 0', () => {
    const artifact = makeArtifact({ pages: 0 });
    const report = gate.check(artifact);
    expect(report.conclusion).toBe('block');
    expect(report.items.find(i => i.rule === 'page-count')?.passed).toBe(false);
  });

  it('blocks on content-stuffed sections', () => {
    const longText = 'x'.repeat(2500);
    const artifact = makeArtifact({
      html: `<html><head></head><body><section><p>${longText}</p></section></body></html>`,
      pages: 1,
    });
    const report = gate.check(artifact);
    expect(report.items.find(i => i.rule === 'content-density')?.passed).toBe(false);
  });

  it('blocks on empty sections', () => {
    const artifact = makeArtifact({
      html: '<html><head></head><body><section></section><section><p>OK</p></section></body></html>',
      pages: 1,
    });
    const report = gate.check(artifact);
    expect(report.items.find(i => i.rule === 'no-empty-sections')?.passed).toBe(false);
  });
});

// --- L2 Tests ---

describe('QualityGateL2Impl', () => {
  const gate = new QualityGateL2Impl();

  it('passes a well-formed slides artifact', async () => {
    const artifact = makeArtifact({
      html: '<html><head><title>AI Design</title></head><body><section><h1>AI Design</h1></section><section><p>AI is transforming design workflows</p></section><style>color: var(--cd-primary);</style></body></html>',
    });
    const report = await gate.check(artifact);
    expect(report.conclusion).toBe('pass');
  });

  it('warns when no title or h1 found for semantic coherence', async () => {
    const artifact = makeArtifact({
      html: '<html><head></head><body><section><p>Content without any heading</p></section><section><p>More content</p></section><style>var(--cd-bg)</style></body></html>',
    });
    const report = await gate.check(artifact);
    const item = report.items.find(i => i.rule === 'semantic-coherence');
    expect(item?.passed).toBe(false);
    expect(item?.severity).toBe('warn');
  });

  it('blocks when body has no text content', async () => {
    const artifact = makeArtifact({
      html: '<html><head><title>Empty</title></head><body><div></div></body></html>',
    });
    const report = await gate.check(artifact);
    expect(report.conclusion).toBe('block');
    expect(report.items.find(i => i.rule === 'structural-body-content')?.passed).toBe(false);
  });

  it('warns when slides have fewer than 2 sections', async () => {
    const artifact = makeArtifact({
      type: 'slides',
      html: '<html><head><title>One</title></head><body><section><h1>Only one</h1><p>slide content</p></section><style>var(--cd-bg)</style></body></html>',
    });
    const report = await gate.check(artifact);
    const item = report.items.find(i => i.rule === 'structural-slides-sections');
    expect(item?.passed).toBe(false);
    expect(item?.severity).toBe('warn');
  });

  it('warns when no --cd-* CSS variables used', async () => {
    const artifact = makeArtifact({
      type: 'chart',
      html: '<html><head><title>Chart</title></head><body><section><p>Chart data visualization</p></section></body></html>',
    });
    const report = await gate.check(artifact);
    const item = report.items.find(i => i.rule === 'theme-compliance');
    expect(item?.passed).toBe(false);
    expect(item?.severity).toBe('warn');
  });
});
