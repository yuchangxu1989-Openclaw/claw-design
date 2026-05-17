// SVG Formatter — extracts SVG from HTML or wraps content in foreignObject

import type { OutputFormatter, OutputFormat, FormatOptions } from './output-formatter.js';

export class SvgFormatter implements OutputFormatter {
  readonly format: OutputFormat = 'svg';

  supports(format: OutputFormat): boolean {
    return format === 'svg';
  }

  async render(html: string, options?: FormatOptions): Promise<string> {
    const width = options?.width ?? 800;
    const height = options?.height ?? 600;

    // Try to extract existing SVG element from HTML
    const extracted = this.extractSvg(html);
    if (extracted) {
      return extracted;
    }

    // No SVG found — wrap HTML in foreignObject
    return this.wrapInForeignObject(html, width, height);
  }

  private extractSvg(html: string): string | null {
    // Match outermost <svg ...>...</svg> (non-greedy across newlines)
    const match = html.match(/<svg[\s\S]*?<\/svg>/i);
    return match ? match[0] : null;
  }

  private wrapInForeignObject(html: string, width: number, height: number): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<foreignObject width="100%" height="100%">
<div xmlns="http://www.w3.org/1999/xhtml">
${html}
</div>
</foreignObject>
</svg>`;
  }
}
