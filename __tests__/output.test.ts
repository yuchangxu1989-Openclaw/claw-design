// Output module unit tests

import { describe, expect, it, beforeEach } from 'vitest';
import { HtmlFormatter } from '../src/output/html-formatter.ts';
import { SvgFormatter } from '../src/output/svg-formatter.ts';
import { FormatRegistry } from '../src/output/format-registry.ts';
import type { OutputFormatter } from '../src/output/output-formatter.ts';

// --- HtmlFormatter Tests ---

describe('HtmlFormatter', () => {
  let formatter: HtmlFormatter;

  beforeEach(() => {
    formatter = new HtmlFormatter();
  });

  it('wraps HTML with doctype and meta tags', async () => {
    const result = await formatter.render('<h1>Hello</h1>');
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<meta charset="UTF-8">');
    expect(result).toContain('<meta name="generator" content="Claw Design">');
    expect(result).toContain('<h1>Hello</h1>');
  });

  it('applies width option as max-width style', async () => {
    const result = await formatter.render('<p>Test</p>', { width: 1024 });
    expect(result).toContain('max-width:1024px');
  });

  it('applies scale option as transform', async () => {
    const result = await formatter.render('<p>Test</p>', { scale: 2 });
    expect(result).toContain('transform:scale(2)');
  });

  it('does not add style when no options', async () => {
    const result = await formatter.render('<p>Test</p>');
    expect(result).not.toContain('style=');
  });

  it('supports only html format', () => {
    expect(formatter.supports('html')).toBe(true);
    expect(formatter.supports('pdf')).toBe(false);
    expect(formatter.supports('svg')).toBe(false);
    expect(formatter.supports('png')).toBe(false);
  });
});

// --- SvgFormatter Tests ---

describe('SvgFormatter', () => {
  let formatter: SvgFormatter;

  beforeEach(() => {
    formatter = new SvgFormatter();
  });

  it('extracts existing SVG from HTML', async () => {
    const html = '<div><svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg></div>';
    const result = await formatter.render(html);
    expect(result).toContain('<svg');
    expect(result).toContain('<circle');
    expect(result).not.toContain('foreignObject');
  });

  it('wraps non-SVG HTML in foreignObject', async () => {
    const html = '<div><h1>No SVG here</h1></div>';
    const result = await formatter.render(html);
    expect(result).toContain('<foreignObject');
    expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(result).toContain('<h1>No SVG here</h1>');
  });

  it('uses width/height options for foreignObject wrapper', async () => {
    const result = await formatter.render('<p>Test</p>', { width: 1200, height: 900 });
    expect(result).toContain('width="1200"');
    expect(result).toContain('height="900"');
    expect(result).toContain('viewBox="0 0 1200 900"');
  });

  it('defaults to 800x600 when no options', async () => {
    const result = await formatter.render('<p>Test</p>');
    expect(result).toContain('width="800"');
    expect(result).toContain('height="600"');
  });

  it('supports only svg format', () => {
    expect(formatter.supports('svg')).toBe(true);
    expect(formatter.supports('html')).toBe(false);
    expect(formatter.supports('pdf')).toBe(false);
    expect(formatter.supports('png')).toBe(false);
  });
});

// --- FormatRegistry Tests ---

describe('FormatRegistry', () => {
  let registry: FormatRegistry;

  beforeEach(() => {
    registry = new FormatRegistry();
  });

  it('registers and retrieves a formatter', () => {
    const htmlFormatter = new HtmlFormatter();
    registry.registerFormatter(htmlFormatter);
    expect(registry.getFormatter('html')).toBe(htmlFormatter);
  });

  it('returns undefined for unregistered format', () => {
    expect(registry.getFormatter('pdf')).toBeUndefined();
  });

  it('lists all registered formats', () => {
    registry.registerFormatter(new HtmlFormatter());
    registry.registerFormatter(new SvgFormatter());
    const formats = registry.listFormats();
    expect(formats).toContain('html');
    expect(formats).toContain('svg');
    expect(formats).toHaveLength(2);
  });

  it('overwrites formatter for same format', () => {
    const first = new HtmlFormatter();
    const second = new HtmlFormatter();
    registry.registerFormatter(first);
    registry.registerFormatter(second);
    expect(registry.getFormatter('html')).toBe(second);
  });

  it('supports() delegates correctly on retrieved formatter', () => {
    registry.registerFormatter(new HtmlFormatter());
    registry.registerFormatter(new SvgFormatter());
    const html = registry.getFormatter('html')!;
    const svg = registry.getFormatter('svg')!;
    expect(html.supports('html')).toBe(true);
    expect(html.supports('svg')).toBe(false);
    expect(svg.supports('svg')).toBe(true);
    expect(svg.supports('html')).toBe(false);
  });
});
