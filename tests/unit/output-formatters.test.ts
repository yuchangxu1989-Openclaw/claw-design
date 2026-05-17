import { describe, expect, it } from 'vitest';
import { HtmlFormatter } from '../../src/output/html-formatter.js';
import { SvgFormatter } from '../../src/output/svg-formatter.js';
import { FormatRegistry } from '../../src/output/format-registry.js';

describe('Output formatters', () => {
  it('HTML formatter supports only html output', () => {
    const formatter = new HtmlFormatter();

    expect(formatter.supports('html')).toBe(true);
    expect(formatter.supports('svg')).toBe(false);
  });

  it('HTML formatter wraps fragments in a full HTML document', async () => {
    const output = await new HtmlFormatter().render('<main>content</main>');

    expect(output).toContain('<!DOCTYPE html>');
    expect(output).toContain('<body>');
    expect(output).toContain('<main>content</main>');
  });

  it('HTML formatter applies width and scale styles when requested', async () => {
    const output = await new HtmlFormatter().render('<div>scaled</div>', { width: 960, scale: 0.5 });

    expect(output).toContain('style="max-width:960px;transform:scale(0.5);transform-origin:top left;"');
  });

  it('SVG formatter supports only svg output', () => {
    const formatter = new SvgFormatter();

    expect(formatter.supports('svg')).toBe(true);
    expect(formatter.supports('html')).toBe(false);
  });

  it('SVG formatter extracts an existing svg element', async () => {
    const svg = '<svg viewBox="0 0 10 10"><rect width="10" height="10" /></svg>';
    const output = await new SvgFormatter().render(`<div>${svg}</div>`);

    expect(output).toBe(svg);
  });

  it('SVG formatter wraps HTML in a foreignObject when no svg is present', async () => {
    const output = await new SvgFormatter().render('<div>card</div>', { width: 1024, height: 768 });

    expect(output).toContain('<foreignObject');
    expect(output).toContain('width="1024"');
    expect(output).toContain('<div xmlns="http://www.w3.org/1999/xhtml">');
  });

  it('FormatRegistry stores and retrieves formatters by format key', () => {
    const registry = new FormatRegistry();
    const htmlFormatter = new HtmlFormatter();
    const svgFormatter = new SvgFormatter();
    registry.registerFormatter(htmlFormatter);
    registry.registerFormatter(svgFormatter);

    expect(registry.getFormatter('html')).toBe(htmlFormatter);
    expect(registry.getFormatter('svg')).toBe(svgFormatter);
    expect(registry.listFormats()).toEqual(['html', 'svg']);
  });
});
