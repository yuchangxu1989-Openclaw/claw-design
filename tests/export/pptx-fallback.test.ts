import { describe, expect, it } from 'vitest';
import {
  extractPptxPageAnalyses,
  buildFallbackNote,
  buildFallbackImageData,
} from '../../src/export/pptx-fallback.js';
import type { ThemePack } from '../../src/types.js';

const theme: ThemePack = {
  colorPrimary: '#3366ff',
  colorBg: '#ffffff',
  fontHeading: 'Heading',
  fontBody: 'Body',
  spacingUnit: '8px',
  radius: '4px',
  cssVariables: {},
};

// Helper: generate nested divs to a given depth
function nestedDivs(depth: number): string {
  return '<div>'.repeat(depth) + 'content' + '</div>'.repeat(depth);
}

// Helper: generate N complex SVG signal tags inside an <svg>
function svgWithSignals(count: number): string {
  const signals = ['<path d="M0 0"/>', '<filter id="f"/>', '<mask id="m"/>', '<clipPath id="c"/>', '<linearGradient id="g"/>'];
  const tags = signals.slice(0, count).join('');
  return `<svg>${tags}</svg>`;
}

describe('detectFallbackReasons (via extractPptxPageAnalyses)', () => {
  // ── complexSvgSignals threshold: 2 vs 3 ──

  it('does NOT trigger complex-svg with 2 SVG signals', () => {
    const html = `<section>${svgWithSignals(2)}<p>text</p></section>`;
    const pages = extractPptxPageAnalyses(html);
    expect(pages).toHaveLength(1);
    const svgReason = pages[0].fallbackReasons.find(r => r.code === 'complex-svg');
    expect(svgReason).toBeUndefined();
  });

  it('triggers complex-svg with 3 SVG signals', () => {
    const html = `<section>${svgWithSignals(3)}<p>text</p></section>`;
    const pages = extractPptxPageAnalyses(html);
    expect(pages).toHaveLength(1);
    const svgReason = pages[0].fallbackReasons.find(r => r.code === 'complex-svg');
    expect(svgReason).toBeDefined();
    expect(svgReason!.code).toBe('complex-svg');
  });

  it('triggers complex-svg with multiple <svg> tags even without complex signals', () => {
    const html = `<section><svg><rect/></svg><svg><rect/></svg><p>text</p></section>`;
    const pages = extractPptxPageAnalyses(html);
    const svgReason = pages[0].fallbackReasons.find(r => r.code === 'complex-svg');
    expect(svgReason).toBeDefined();
  });

  // ── nestedDepth threshold: 8 vs 9 ──

  it('does NOT trigger nested-layout at depth 8 (section + 7 divs)', () => {
    // section(1) + 7 divs = max depth 8, below threshold of 9
    const html = `<section>${nestedDivs(7)}</section>`;
    const pages = extractPptxPageAnalyses(html);
    expect(pages).toHaveLength(1);
    const nestedReason = pages[0].fallbackReasons.find(r => r.code === 'nested-layout');
    expect(nestedReason).toBeUndefined();
  });

  it('triggers nested-layout at depth 9 (section + 8 divs)', () => {
    // section(1) + 8 divs = max depth 9, hits threshold
    const html = `<section>${nestedDivs(8)}</section>`;
    const pages = extractPptxPageAnalyses(html);
    expect(pages).toHaveLength(1);
    const nestedReason = pages[0].fallbackReasons.find(r => r.code === 'nested-layout');
    expect(nestedReason).toBeDefined();
  });

  // ── animation detection ──

  it('triggers animation fallback when CSS animation is present', () => {
    const html = `<section><div style="animation: fade 1s;">text</div></section>`;
    const pages = extractPptxPageAnalyses(html);
    const animReason = pages[0].fallbackReasons.find(r => r.code === 'animation');
    expect(animReason).toBeDefined();
  });

  it('returns no fallback reasons for simple HTML', () => {
    const html = `<section><h1>Title</h1><p>Simple paragraph</p></section>`;
    const pages = extractPptxPageAnalyses(html);
    expect(pages).toHaveLength(1);
    expect(pages[0].requiresFallback).toBe(false);
    expect(pages[0].fallbackReasons).toHaveLength(0);
  });
});

describe('buildFallbackNote', () => {
  it('includes page index and reason messages', () => {
    const page = extractPptxPageAnalyses(
      `<section>${svgWithSignals(4)}<p>text</p></section>`,
    )[0];
    const note = buildFallbackNote(page);
    expect(note).toContain('第 1 页');
    expect(note).toContain('SVG');
  });
});

describe('buildFallbackImageData', () => {
  it('returns a base64 SVG data URI', () => {
    const page = extractPptxPageAnalyses(
      `<section><h1>Hello</h1><p>world</p></section>`,
    )[0];
    const data = buildFallbackImageData(page, theme);
    expect(data).toMatch(/^image\/svg\+xml;base64,/);
  });
});

describe('extractPptxPageAnalyses', () => {
  it('extracts multiple sections as separate pages', () => {
    const html = `
      <section><h1>Page 1</h1><p>Content 1</p></section>
      <section><h2>Page 2</h2><p>Content 2</p></section>
    `;
    const pages = extractPptxPageAnalyses(html);
    expect(pages).toHaveLength(2);
    expect(pages[0].title).toBe('Page 1');
    expect(pages[1].title).toBe('Page 2');
  });

  it('falls back to body content when no sections exist', () => {
    const html = `<body><h1>Solo</h1><p>Only page</p></body>`;
    const pages = extractPptxPageAnalyses(html);
    expect(pages).toHaveLength(1);
    expect(pages[0].title).toBe('Solo');
  });
});
